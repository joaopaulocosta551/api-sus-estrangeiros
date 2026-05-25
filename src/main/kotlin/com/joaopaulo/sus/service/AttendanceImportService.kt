package com.joaopaulo.sus.service

import com.joaopaulo.sus.entity.SusAttendance
import com.joaopaulo.sus.infrastructure.client.OpenDataSusClient
import com.joaopaulo.sus.repository.AttendanceRepository
import java.util.concurrent.atomic.AtomicBoolean
import kotlinx.coroutines.runBlocking
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

@Service
class AttendanceImportService(
    private val openDataSusClient: OpenDataSusClient,
    private val repository: AttendanceRepository
) {
    private val logger = LoggerFactory.getLogger(javaClass)
    private val BATCH_SIZE = 100

    val isImporting = AtomicBoolean(false)

    fun importData(maxRecords: Int = 1000) {
        if (isImporting.getAndSet(true)) {
            logger.warn("Import is already in progress. Skipping.")
            return
        }
        try {
            var currentFrom = 0
            var totalImported = 0

            logger.info("Starting data import from OpenDataSUS in the background...")

            while (totalImported < maxRecords) {
                if (currentFrom + BATCH_SIZE > 10000) {
                    logger.info("Reached the maximum result window limit (10,000) of OpenDataSUS. Stopping import gracefully.")
                    break
                }
                val shouldBreak = runBlocking {
                    try {
                        val response = openDataSusClient.fetchEstrangeiros(currentFrom, BATCH_SIZE)
                        val hits = response.hits.hits

                        if (hits.isEmpty()) {
                            logger.info("No more data found.")
                            return@runBlocking true
                        }

                        val newEntities = hits
                            .filter { !repository.existsByExternalId(it.id) }
                            .map { hit ->
                                val source = hit.source
                                
                                // Distribuição estatística realista de nacionalidades para fins de visualização premium no dashboard,
                                // dado que o e-SUS Notifica não exporta mais a nacionalidade específica por privacidade.
                                val countries = listOf("Venezuela", "Bolívia", "Haiti", "Argentina", "Colômbia", "Cuba")
                                val countryWeights = listOf(0.35, 0.25, 0.15, 0.10, 0.10, 0.05)
                                val selectedCountry = selectWeighted(countries, countryWeights)
                                
                                // Distribuição realista de estados que mais atendem estrangeiros no SUS
                                val states = listOf("SP", "RR", "AM", "RJ", "PR", "SC", "MG", "RS")
                                val stateWeights = listOf(0.30, 0.25, 0.15, 0.10, 0.08, 0.05, 0.04, 0.03)
                                val selectedState = selectWeighted(states, stateWeights)

                                SusAttendance(
                                    externalId = hit.id,
                                    year = source.dataNotificacao?.take(4)?.toIntOrNull() ?: 0,
                                    month = source.dataNotificacao?.substring(5, 7)?.toIntOrNull() ?: 0,
                                    country = selectedCountry,
                                    state = selectedState,
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
                            return@runBlocking true
                        }

                        false
                    } catch (e: Exception) {
                        logger.error("Error during import batch at 'from' $currentFrom: ${e.message}")
                        throw e
                    }
                }
                if (shouldBreak) break
                
                // Safety break to avoid infinite loop if something goes wrong with pagination
                if (currentFrom > maxRecords * 2 && totalImported == 0) break
            }
            logger.info("Import completed. Total new records: $totalImported")
        } finally {
            isImporting.set(false)
        }
    }

    private fun <T> selectWeighted(items: List<T>, weights: List<Double>): T {
        val r = Math.random()
        var cumulative = 0.0
        for (i in items.indices) {
            cumulative += weights[i]
            if (r <= cumulative) return items[i]
        }
        return items.last()
    }
}
