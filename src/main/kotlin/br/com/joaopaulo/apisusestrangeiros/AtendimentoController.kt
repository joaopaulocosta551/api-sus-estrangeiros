package br.com.joaopaulo.apisusestrangeiros

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/atendimentos")
class AtendimentoController(private val service: AtendimentoService) {

    @GetMapping
    fun listarTodos(): List<AtendimentoSus> {
        return service.listarTodos()
    }

    @GetMapping("/{id}")
    fun buscarPorId(@PathVariable id: Long): ResponseEntity<AtendimentoSus> {
        val atendimento = service.buscarPorId(id)
        return if (atendimento != null) {
            ResponseEntity.ok(atendimento)
        } else {
            ResponseEntity.notFound().build()
        }
    }

    @GetMapping("/pais/{pais}")
    fun buscarPorPais(@PathVariable pais: String): List<AtendimentoSus> {
        return service.buscarPorPais(pais)
    }

    @GetMapping("/estado/{estado}")
    fun buscarPorEstado(@PathVariable estado: String): List<AtendimentoSus> {
        return service.buscarPorEstado(estado)
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun salvar(@RequestBody atendimento: AtendimentoSus): AtendimentoSus {
        return service.salvar(atendimento)
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deletar(@PathVariable id: Long) {
        service.deletar(id)
    }
}
