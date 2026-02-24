package br.com.joaopaulo.apisusestrangeiros

import jakarta.persistence.*

@Entity
@Table(name = "atendimentos")
class AtendimentoSus(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,

    var ano: Int = 0,
    var mes: Int = 0,
    var pais: String = "",
    var estado: String = "",
    var quantidade: Int = 0
)