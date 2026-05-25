package com.joaopaulo.sus.dto

data class AttendanceResponse(
    val id: Long?,
    val externalId: String?,
    val year: Int,
    val month: Int,
    val country: String,
    val state: String,
    val quantity: Int
)
