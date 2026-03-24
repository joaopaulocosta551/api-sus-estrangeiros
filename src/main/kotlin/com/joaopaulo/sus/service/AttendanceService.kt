package com.joaopaulo.sus.service

import com.joaopaulo.sus.entity.SusAttendance
import com.joaopaulo.sus.repository.AttendanceRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class AttendanceService(private val repository: AttendanceRepository) {

    private val logger = LoggerFactory.getLogger(AttendanceService::class.java)

    fun findAll(): List<SusAttendance> {
        logger.info("Fetching all attendances")
        return repository.findAll()
    }

    @Transactional
    fun save(attendance: SusAttendance): SusAttendance {
        logger.info("Saving new attendance for country: {}", attendance.country)
        return repository.save(attendance)
    }

    fun findById(id: Long): SusAttendance? {
        logger.info("Finding attendance by id: {}", id)
        return repository.findById(id).orElse(null)
    }

    fun findByCountry(country: String): List<SusAttendance> {
        logger.info("Finding attendances by country: {}", country)
        return repository.findByCountry(country)
    }

    fun findByState(state: String): List<SusAttendance> {
        logger.info("Finding attendances by state: {}", state)
        return repository.findByState(state)
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
}
