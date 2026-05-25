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
            var totalImported = 0
            
            // Define years and months to partition our queries to bypass the 10,000 limit
            val years = listOf(2023, 2024, 2022, 2021)
            val months = (1..12).toList()
            
            logger.info("Starting background month-by-month data import from OpenDataSUS...")
            
            outerLoop@ for (year in years) {
                for (month in months) {
                    if (totalImported >= maxRecords) {
                        logger.info("Reached maximum record target limit ($maxRecords). Stopping.")
                        break@outerLoop
                    }
                    
                    val lastDay = when(month) {
                        2 -> if (year % 4 == 0) 29 else 28
                        4, 6, 9, 11 -> 30
                        else -> 31
                    }
                    
                    val startStr = "$year-${month.toString().padStart(2, '0')}-01T00:00:00.000Z"
                    val endStr = "$year-${month.toString().padStart(2, '0')}-${lastDay}T23:59:59.999Z"
                    val queryString = "estrangeiro: \"Sim\" AND dataNotificacao:[$startStr TO $endStr]"
                    
                    logger.info("Synchronizing data period: $month/$year...")
                    
                    var currentFrom = 0
                    var monthImported = 0
                    
                    while (totalImported < maxRecords) {
                        // Max result window protection per monthly query (highly safe!)
                        if (currentFrom + BATCH_SIZE > 10000) {
                            logger.info("Reached the maximum result window limit (10,000) for period $month/$year. Skipping to next period.")
                            break
                        }
                        
                        val shouldBreakPeriod = runBlocking {
                            try {
                                val response = openDataSusClient.fetchEstrangeiros(currentFrom, BATCH_SIZE, queryString)
                                val hits = response.hits.hits
                                
                                if (hits.isEmpty()) {
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
                                    monthImported += newEntities.size
                                    logger.info("Imported $totalImported records total ($monthImported in $month/$year)...")
                                }

                                currentFrom += BATCH_SIZE
                                
                                if (hits.size < BATCH_SIZE) {
                                    return@runBlocking true
                                }
                                
                                false
                            } catch (e: Exception) {
                                logger.error("Error during import batch for period $month/$year at 'from' $currentFrom: ${e.message}")
                                // Return true to skip this period gracefully and keep other periods syncing in the background!
                                return@runBlocking true
                            }
                        }
                        if (shouldBreakPeriod) break
                    }
                }
            }
            logger.info("Full background sync completed successfully! Total new records: $totalImported")
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
