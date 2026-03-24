package br.com.joaopaulo.apisusestrangeiros

import com.fasterxml.jackson.databind.ObjectMapper
import org.junit.jupiter.api.Test
import org.mockito.ArgumentMatchers.any as mockitoAny
import org.mockito.BDDMockito.given
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.http.MediaType
import org.springframework.test.context.bean.override.mockito.MockitoBean
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*

@WebMvcTest(AtendimentoController::class)
class AtendimentoControllerTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @MockitoBean
    private lateinit var service: AtendimentoService

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @Test
    fun `deve listar todos os atendimentos`() {
        val atendimentos = listOf(
            AtendimentoSus(id = 1L, ano = 2024, mes = 1, pais = "Argentina", estado = "SP", quantidade = 100),
            AtendimentoSus(id = 2L, ano = 2024, mes = 1, pais = "Uruguai", estado = "RS", quantidade = 50)
        )

        given(service.listarTodos()).willReturn(atendimentos)

        mockMvc.perform(get("/api/atendimentos"))
            .andExpect(status().isOk)
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$[0].pais").value("Argentina"))
            .andExpect(jsonPath("$[1].pais").value("Uruguai"))
            .andExpect(jsonPath("$.length()").value(2))
    }

    @Test
    fun `deve buscar atendimento por ID com sucesso`() {
        val atendimento = AtendimentoSus(id = 1L, ano = 2024, mes = 1, pais = "Chile", estado = "PR", quantidade = 30)

        given(service.buscarPorId(1L)).willReturn(atendimento)

        mockMvc.perform(get("/api/atendimentos/1"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.pais").value("Chile"))
            .andExpect(jsonPath("$.estado").value("PR"))
    }

    @Test
    fun `deve retornar 404 ao buscar ID inexistente`() {
        given(service.buscarPorId(99L)).willReturn(null)

        mockMvc.perform(get("/api/atendimentos/99"))
            .andExpect(status().isNotFound)
    }

    @Test
    fun `deve criar um novo atendimento`() {
        val atendimentoSalvo = AtendimentoSus(id = 1L, ano = 2024, mes = 2, pais = "Bolivia", estado = "MS", quantidade = 20)

        // Usamos a função auxiliar any() definida abaixo para evitar NPE
        given(service.salvar(any())).willReturn(atendimentoSalvo)

        val novoAtendimento = AtendimentoSus(ano = 2024, mes = 2, pais = "Bolivia", estado = "MS", quantidade = 20)

        mockMvc.perform(
            post("/api/atendimentos")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(novoAtendimento))
        )
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.pais").value("Bolivia"))
    }

    // Função utilitária para "enganar" o sistema de tipos do Kotlin ao usar matchers do Mockito
    private fun <T> any(): T {
        mockitoAny<T>()
        return uninitialized()
    }

    @Suppress("UNCHECKED_CAST")
    private fun <T> uninitialized(): T = null as T
}
