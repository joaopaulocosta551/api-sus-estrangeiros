package br.com.joaopaulo.apisusestrangeiros

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class AtendimentoService(private val repository: AtendimentoRepository) {

    fun listarTodos(): List<AtendimentoSus> {
        return repository.findAll()
    }

    @Transactional
    fun salvar(atendimento: AtendimentoSus): AtendimentoSus {
        return repository.save(atendimento)
    }

    fun buscarPorId(id: Long): AtendimentoSus? {
        return repository.findById(id).orElse(null)
    }

    fun buscarPorPais(pais: String): List<AtendimentoSus> {
        return repository.findByPais(pais)
    }

    fun buscarPorEstado(estado: String): List<AtendimentoSus> {
        return repository.findByEstado(estado)
    }

    @Transactional
    fun deletar(id: Long) {
        if (repository.existsById(id)) {
            repository.deleteById(id)
        }
    }
}
