package com.joaopaulo.sus.controller

import com.joaopaulo.sus.dto.*
import com.joaopaulo.sus.service.AttendanceService
import jakarta.validation.Valid
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/attendances")
class AttendanceController(private val service: AttendanceService) {

    private val logger = LoggerFactory.getLogger(AttendanceController::class.java)

    @GetMapping
    fun findAll(
        @RequestParam(required = false) year: Int?,
        @RequestParam(required = false) month: Int?,
        @RequestParam(required = false) country: String?,
        @RequestParam(required = false) state: String?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): Page<AttendanceResponse> {
        logger.info("Received request to list paginated attendances - year={}, month={}, country={}, state={}, page={}, size={}", 
            year, month, country, state, page, size)
        
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"))
        return service.findAll(year, month, country, state, pageable)
    }

    @GetMapping("/stats")
    fun getStats(
        @RequestParam(required = false) year: Int?,
        @RequestParam(required = false) month: Int?,
        @RequestParam(required = false) country: String?,
        @RequestParam(required = false) state: String?
    ): ResponseEntity<DashboardStats> {
        logger.info("Received request to get dashboard stats - year={}, month={}, country={}, state={}", 
            year, month, country, state)
        
        val stats = service.getDashboardStats(year, month, country, state)
        return ResponseEntity.ok(stats)
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
