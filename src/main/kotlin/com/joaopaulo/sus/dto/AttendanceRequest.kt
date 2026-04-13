package com.joaopaulo.sus.dto

import jakarta.validation.constraints.*

data class AttendanceRequest(
    @field:Min(2000)
    @field:Max(2100)
    val year: Int,

    @field:Min(1)
    @field:Max(12)
    val month: Int,

    @field:NotBlank(message = "Country is required")
    val country: String,

    @field:NotBlank(message = "State is required")
    @field:Size(min = 2, max = 2, message = "State must be 2 characters (e.g. SP, RJ)")
    val state: String,

    @field:Min(0, message = "Quantity cannot be negative")
    val quantity: Int
)
