package com.joaopaulo.sus.dto

data class DashboardStats(
    val total: Long,
    val stateStats: List<StateStat>,
    val countryStats: List<CountryStat>,
    val monthlyStats: List<MonthlyStat>,
    val availableStates: List<String>
)

data class StateStat(
    val state: String,
    val count: Long
)

data class CountryStat(
    val country: String,
    val count: Long
)

data class MonthlyStat(
    val label: String,
    val rawDate: String,
    val count: Long
)
