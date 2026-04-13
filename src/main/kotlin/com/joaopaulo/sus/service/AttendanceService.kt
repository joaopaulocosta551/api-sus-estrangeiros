package com.joaopaulo.sus.service

import com.joaopaulo.sus.dto.AttendanceRequest
import com.joaopaulo.sus.dto.AttendanceResponse
import com.joaopaulo.sus.entity.SusAttendance
import com.joaopaulo.sus.repository.AttendanceRepository
import com.joaopaulo.sus.repository.specification.AttendanceSpecification
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class AttendanceService(private val repository: AttendanceRepository) {

    private val logger = LoggerFactory.getLogger(AttendanceService::class.java)

    fun findAll(
        year: Int? = null,
        month: Int? = null,
        country: String? = null,
        state: String? = null
    ): List<AttendanceResponse> {
        logger.info("Fetching attendances with filters - year: {}, month: {}, country: {}, state: {}", 
            year, month, country, state)
        
        val spec = AttendanceSpecification.buildFilter(year, month, country, state)
        return repository.findAll(spec).map { it.toResponse() }
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
        year = this.year,
        month = this.month,
        country = this.country,
        state = this.state,
        quantity = this.quantity
    )
}
