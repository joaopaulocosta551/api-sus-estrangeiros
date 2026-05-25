package com.joaopaulo.sus.service

import com.joaopaulo.sus.dto.*
import com.joaopaulo.sus.entity.SusAttendance
import com.joaopaulo.sus.repository.AttendanceRepository
import com.joaopaulo.sus.repository.specification.AttendanceSpecification
import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class AttendanceService(
    private val repository: AttendanceRepository,
    @PersistenceContext private val entityManager: EntityManager
) {

    private val logger = LoggerFactory.getLogger(AttendanceService::class.java)

    fun findAll(
        year: Int? = null,
        month: Int? = null,
        country: String? = null,
        state: String? = null,
        pageable: Pageable
    ): Page<AttendanceResponse> {
        logger.info("Fetching paginated attendances - year: {}, month: {}, country: {}, state: {}, page: {}, size: {}", 
            year, month, country, state, pageable.pageNumber, pageable.pageSize)
        
        val spec = AttendanceSpecification.buildFilter(year, month, country, state)
        return repository.findAll(spec, pageable).map { it.toResponse() }
    }

    fun getDashboardStats(
        year: Int? = null,
        month: Int? = null,
        country: String? = null,
        state: String? = null
    ): DashboardStats {
        logger.info("Generating high-performance dashboard stats - year: {}, month: {}, country: {}, state: {}", 
            year, month, country, state)

        // 1. Build dynamic WHERE clause for JPQL
        val whereClauses = mutableListOf<String>()
        val params = mutableMapOf<String, Any>()

        year?.let {
            whereClauses.add("a.year = :year")
            params["year"] = it
        }
        month?.let {
            whereClauses.add("a.month = :month")
            params["month"] = it
        }
        country?.takeIf { it.isNotBlank() }?.let {
            whereClauses.add("a.country = :country")
            params["country"] = it
        }
        state?.takeIf { it.isNotBlank() }?.let {
            whereClauses.add("a.state = :state")
            params["state"] = it
        }

        val whereString = if (whereClauses.isNotEmpty()) {
            "WHERE " + whereClauses.joinToString(" AND ")
        } else {
            ""
        }

        // 2. Query total count
        val totalQuery = entityManager.createQuery(
            "SELECT COALESCE(SUM(a.quantity), 0L) FROM SusAttendance a $whereString",
            Long::class.javaObjectType
        )
        params.forEach { (name, value) -> totalQuery.setParameter(name, value) }
        val total = totalQuery.singleResult

        // Query global unfiltered total count
        val globalTotalQuery = entityManager.createQuery(
            "SELECT COALESCE(SUM(a.quantity), 0L) FROM SusAttendance a",
            Long::class.javaObjectType
        )
        val globalTotal = globalTotalQuery.singleResult

        // 3. Query state statistics (grouped by state)
        val stateQuery = entityManager.createQuery(
            "SELECT new com.joaopaulo.sus.dto.StateStat(a.state, SUM(a.quantity)) FROM SusAttendance a $whereString GROUP BY a.state ORDER BY SUM(a.quantity) DESC",
            StateStat::class.java
        )
        params.forEach { (name, value) -> stateQuery.setParameter(name, value) }
        val stateStats = stateQuery.resultList

        // 4. Query country statistics (grouped by country)
        val countryQuery = entityManager.createQuery(
            "SELECT new com.joaopaulo.sus.dto.CountryStat(a.country, SUM(a.quantity)) FROM SusAttendance a $whereString GROUP BY a.country ORDER BY SUM(a.quantity) DESC",
            CountryStat::class.java
        )
        params.forEach { (name, value) -> countryQuery.setParameter(name, value) }
        val countryStats = countryQuery.resultList

        // 5. Query monthly trend statistics (grouped by year and month)
        val monthlyQuery = entityManager.createQuery(
            "SELECT a.year, a.month, SUM(a.quantity) FROM SusAttendance a $whereString GROUP BY a.year, a.month ORDER BY a.year ASC, a.month ASC"
        )
        params.forEach { (name, value) -> monthlyQuery.setParameter(name, value) }
        
        val monthNames = listOf("Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez")
        val monthlyStats = monthlyQuery.resultList.map { row ->
            val rowArray = row as Array<*>
            val rYear = (rowArray[0] as Number).toInt()
            val rMonth = (rowArray[1] as Number).toInt()
            val rCount = (rowArray[2] as Number).toLong()
            
            val label = if (rMonth in 1..12) "${monthNames[rMonth - 1]}/${rYear.toString().substring(2)}" else "$rMonth/$rYear"
            val rawDate = "$rYear-${rMonth.toString().padStart(2, '0')}"
            
            MonthlyStat(label, rawDate, rCount)
        }

        // 6. Query all available unique states (for dropdown filter list)
        val availableStatesQuery = entityManager.createQuery(
            "SELECT DISTINCT a.state FROM SusAttendance a ORDER BY a.state ASC",
            String::class.java
        )
        val availableStates = availableStatesQuery.resultList

        return DashboardStats(total, globalTotal, stateStats, countryStats, monthlyStats, availableStates)
    }

    @Transactional
    fun save(request: AttendanceRequest): AttendanceResponse {
        logger.info("Saving new attendance for country: {}", request.country)
        val attendance = SusAttendance(
            year = request.year,
            month = request.month,
            country = request.country,
            state = request.state,
            quantity = request.quantity
        )
        return repository.save(attendance).toResponse()
    }

    fun findById(id: Long): AttendanceResponse? {
        logger.info("Finding attendance by id: {}", id)
        return repository.findById(id).map { it.toResponse() }.orElse(null)
    }

    fun findByCountry(country: String): List<AttendanceResponse> {
        logger.info("Finding attendances by country: {}", country)
        return repository.findByCountry(country).map { it.toResponse() }
    }

    fun findByState(state: String): List<AttendanceResponse> {
        logger.info("Finding attendances by state: {}", state)
        return repository.findByState(state).map { it.toResponse() }
    }

    fun findByPeriod(year: Int, month: Int): List<AttendanceResponse> {
        logger.info("Finding attendances for period: {}/{}", month, year)
        return repository.findByYearAndMonth(year, month).map { it.toResponse() }
    }

    @Transactional
    fun delete(id: Long) {
        logger.warn("Attempting to delete attendance with id: {}", id)
        if (repository.existsById(id)) {
            repository.deleteById(id)
            logger.info("Attendance with id: {} deleted successfully", id)
        } else {
            logger.warn("Attendance with id: {} not found for deletion", id)
        }
    }

    private fun SusAttendance.toResponse() = AttendanceResponse(
        id = this.id,
        externalId = this.externalId,
        year = this.year,
        month = this.month,
        country = this.country,
        state = this.state,
        quantity = this.quantity
    )
}
