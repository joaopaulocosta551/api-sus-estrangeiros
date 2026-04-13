package com.joaopaulo.sus.service

import com.joaopaulo.sus.entity.SusAttendance
import com.joaopaulo.sus.infrastructure.client.OpenDataSusClient
import com.joaopaulo.sus.repository.AttendanceRepository
import kotlinx.coroutines.runBlocking
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class AttendanceImportService(
    private val openDataSusClient: OpenDataSusClient,
    private val repository: AttendanceRepository
) {
    private val logger = LoggerFactory.getLogger(javaClass)
    private val BATCH_SIZE = 100

    @Transactional
    fun importData(maxRecords: Int = 1000) {
        var currentFrom = 0
        var totalImported = 0

        logger.info("Starting data import from OpenDataSUS...")

        while (totalImported < maxRecords) {
            runBlocking {
                try {
                    val response = openDataSusClient.fetchEstrangeiros(currentFrom, BATCH_SIZE)
                    val hits = response.hits.hits

                    if (hits.isEmpty()) {
                        logger.info("No more data found.")
                        return@runBlocking
                    }

                    val newEntities = hits
                        .filter { !repository.existsByExternalId(it.id) }
                        .map { hit ->
                            val source = hit.source
                            SusAttendance(
                                externalId = hit.id,
                                year = source.dataNotificacao?.take(4)?.toIntOrNull() ?: 0,
                                month = source.dataNotificacao?.substring(5, 7)?.toIntOrNull() ?: 0,
                                country = source.paisOrigem ?: "Unknown",
                                state = source.paciente_endereco_uf ?: "SP",
                                quantity = 1
                            )
                        }

                    if (newEntities.isNotEmpty()) {
                        repository.saveAll(newEntities)
                        totalImported += newEntities.size
                        logger.info("Imported $totalImported records so far...")
                    }

                    currentFrom += BATCH_SIZE
                    
                    // Break loop if we reached the end of the source even if totalImported < maxRecords
                    if (hits.size < BATCH_SIZE) {
                        logger.info("Reached the end of OpenDataSUS records.")
                        return@runBlocking
                    }

                } catch (e: Exception) {
                    logger.error("Error during import batch at 'from' $currentFrom: ${e.message}")
                    throw e
                }
            }
            
            // Safety break to avoid infinite loop if something goes wrong with pagination
            if (currentFrom > maxRecords * 2 && totalImported == 0) break
        }
        logger.info("Import completed. Total new records: $totalImported")
    }
}
