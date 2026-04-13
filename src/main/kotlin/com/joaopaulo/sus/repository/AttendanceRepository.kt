package com.joaopaulo.sus.repository

import com.joaopaulo.sus.entity.SusAttendance
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.JpaSpecificationExecutor
import org.springframework.stereotype.Repository

@Repository
interface AttendanceRepository : JpaRepository<SusAttendance, Long>, JpaSpecificationExecutor<SusAttendance> {
    fun findByCountry(country: String): List<SusAttendance>
    fun findByState(state: String): List<SusAttendance>
    fun findByYearAndMonth(year: Int, month: Int): List<SusAttendance>
    fun existsByExternalId(externalId: String): Boolean
}
