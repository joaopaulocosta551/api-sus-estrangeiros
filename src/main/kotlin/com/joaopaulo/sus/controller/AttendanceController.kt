package com.joaopaulo.sus.controller

import com.joaopaulo.sus.dto.AttendanceRequest
import com.joaopaulo.sus.dto.AttendanceResponse
import com.joaopaulo.sus.service.AttendanceService
import jakarta.validation.Valid
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/attendances")
class AttendanceController(private val service: AttendanceService) {

    private val logger = LoggerFactory.getLogger(AttendanceController::class.java)

    @GetMapping
    fun findAll(): List<AttendanceResponse> {
        logger.info("Received request to list all attendances")
        return service.findAll()
    }

    @GetMapping("/{id}")
    fun findById(@PathVariable id: Long): ResponseEntity<AttendanceResponse> {
        logger.info("Received request to find attendance by id: {}", id)
        val attendance = service.findById(id)
        return if (attendance != null) {
            ResponseEntity.ok(attendance)
        } else {
            logger.warn("Attendance not found with id: {}", id)
            ResponseEntity.notFound().build()
        }
    }

    @GetMapping("/country/{country}")
    fun findByCountry(@PathVariable country: String): List<AttendanceResponse> {
        logger.info("Received request to find attendances by country: {}", country)
        return service.findByCountry(country)
    }

    @GetMapping("/state/{state}")
    fun findByState(@PathVariable state: String): List<AttendanceResponse> {
        logger.info("Received request to find attendances by state: {}", state)
        return service.findByState(state)
    }

    @GetMapping("/period/{year}/{month}")
    fun findByPeriod(@PathVariable year: Int, @PathVariable month: Int): List<AttendanceResponse> {
        logger.info("Received request to find attendances by period: {}/{}", month, year)
        return service.findByPeriod(year, month)
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun save(@Valid @RequestBody request: AttendanceRequest): AttendanceResponse {
        logger.info("Received request to save new attendance")
        return service.save(request)
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(@PathVariable id: Long) {
        logger.info("Received request to delete attendance with id: {}", id)
        service.delete(id)
    }
}
