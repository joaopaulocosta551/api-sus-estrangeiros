package br.com.joaopaulo.apisusestrangeiros

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface AtendimentoRepository : JpaRepository<AtendimentoSus, Long> {
    // Aqui podemos adicionar métodos de busca customizados no futuro,
    // como buscar por país ou por período.
    fun findByPais(pais: String): List<AtendimentoSus>
    fun findByEstado(estado: String): List<AtendimentoSus>
}
