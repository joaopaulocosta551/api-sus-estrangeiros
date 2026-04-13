package com.joaopaulo.sus.controller

import com.joaopaulo.sus.service.AttendanceImportService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/attendances/import")
class AttendanceImportController(private val importService: AttendanceImportService) {

    @PostMapping
    fun triggerImport(@RequestParam(defaultValue = "100") maxRecords: Int): ResponseEntity<String> {
        return try {
            importService.importData(maxRecords)
            ResponseEntity.ok("Import process completed successfully for up to $maxRecords records.")
        } catch (e: Exception) {
            ResponseEntity.internalServerError().body("Failed to import data: ${e.message}")
        }
    }
}
