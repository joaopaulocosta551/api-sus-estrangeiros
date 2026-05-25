package com.joaopaulo.sus.controller

import com.joaopaulo.sus.service.AttendanceImportService
import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.concurrent.CompletableFuture

@RestController
@RequestMapping("/api/attendances/import")
class AttendanceImportController(private val importService: AttendanceImportService) {

    private val logger = LoggerFactory.getLogger(javaClass)

    @PostMapping
    fun triggerImport(@RequestParam(defaultValue = "100") maxRecords: Int): ResponseEntity<Map<String, String>> {
        logger.info("Triggering asynchronous import for up to $maxRecords records.")
        
        CompletableFuture.runAsync {
            try {
                importService.importData(maxRecords)
            } catch (e: Exception) {
                logger.error("Asynchronous background import failed: ${e.message}")
            }
        }

        return ResponseEntity.accepted().body(mapOf(
            "status" to "success",
            "message" to "Sincronização iniciada em segundo plano para até $maxRecords registros."
        ))
    }

    @GetMapping("/status")
    fun getImportStatus(): ResponseEntity<Map<String, Boolean>> {
        return ResponseEntity.ok(mapOf(
            "isImporting" to importService.isImporting.get()
        ))
    }
}
