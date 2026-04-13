package com.joaopaulo.sus.controller

import com.fasterxml.jackson.databind.ObjectMapper
import com.joaopaulo.sus.dto.AttendanceRequest
import com.joaopaulo.sus.dto.AttendanceResponse
import com.joaopaulo.sus.service.AttendanceService
import org.junit.jupiter.api.Test
import org.mockito.ArgumentMatchers.any as mockitoAny
import org.mockito.BDDMockito.given
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.http.MediaType
import org.springframework.security.test.context.support.WithMockUser
import org.springframework.test.context.bean.override.mockito.MockitoBean
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*

@WebMvcTest(AttendanceController::class)
@WithMockUser // Adds a mock user for Spring Security
class AttendanceControllerTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @MockitoBean
    private lateinit var service: AttendanceService

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @Test
    fun `should list all attendances`() {
        val responses = listOf(
            AttendanceResponse(id = 1L, year = 2024, month = 1, country = "Argentina", state = "SP", quantity = 100),
            AttendanceResponse(id = 2L, year = 2024, month = 1, country = "Uruguay", state = "RS", quantity = 50)
        )

        given(service.findAll()).willReturn(responses)

        mockMvc.perform(get("/api/attendances"))
            .andExpect(status().isOk)
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$[0].country").value("Argentina"))
            .andExpect(jsonPath("$[1].country").value("Uruguay"))
            .andExpect(jsonPath("$.length()").value(2))
    }

    @Test
    fun `should find attendance by ID successfully`() {
        val response = AttendanceResponse(id = 1L, year = 2024, month = 1, country = "Chile", state = "PR", quantity = 30)

        given(service.findById(1L)).willReturn(response)

        mockMvc.perform(get("/api/attendances/1"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.country").value("Chile"))
            .andExpect(jsonPath("$.state").value("PR"))
    }

    @Test
    fun `should return 404 when searching for non-existent ID`() {
        given(service.findById(99L)).willReturn(null)

        mockMvc.perform(get("/api/attendances/99"))
            .andExpect(status().isNotFound)
    }

    @Test
    fun `should create a new attendance`() {
        val savedResponse = AttendanceResponse(id = 1L, year = 2024, month = 2, country = "Bolivia", state = "MS", quantity = 20)

        given(service.save(any())).willReturn(savedResponse)

        val request = AttendanceRequest(year = 2024, month = 2, country = "Bolivia", state = "MS", quantity = 20)

        mockMvc.perform(
            post("/api/attendances")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
        )
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.country").value("Bolivia"))
    }

    @Test
    fun `should return 400 when creating attendance with invalid data`() {
        val invalidRequest = AttendanceRequest(year = 1999, month = 13, country = "", state = "XYZ", quantity = -1)

        mockMvc.perform(
            post("/api/attendances")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest))
        )
            .andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.message").value("Validation failed"))
            .andExpect(jsonPath("$.errors.year").exists())
            .andExpect(jsonPath("$.errors.month").exists())
            .andExpect(jsonPath("$.errors.country").exists())
            .andExpect(jsonPath("$.errors.state").exists())
            .andExpect(jsonPath("$.errors.quantity").exists())
    }

    // Utility function to "trick" Kotlin's type system when using Mockito matchers
    private fun <T> any(): T {
        mockitoAny<T>()
        return uninitialized()
    }

    @Suppress("UNCHECKED_CAST")
    private fun <T> uninitialized(): T = null as T
}
