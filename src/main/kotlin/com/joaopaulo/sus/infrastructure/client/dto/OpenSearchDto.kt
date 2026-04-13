package com.joaopaulo.sus.infrastructure.client.dto

import kotlinx.serialization.Serializable
import kotlinx.serialization.SerialName

@Serializable
data class OpenSearchRequest(
    val from: Int = 0,
    val size: Int = 100,
    val query: OpenSearchQuery
)

@Serializable
data class OpenSearchQuery(
    @SerialName("query_string") val queryString: QueryString
)

@Serializable
data class QueryString(
    val query: String
)

@Serializable
data class OpenSearchResponse(
    val hits: HitsContainer
)

@Serializable
data class HitsContainer(
    val total: TotalInfo,
    val hits: List<Hit>
)

@Serializable
data class TotalInfo(
    val value: Int
)

@Serializable
data class Hit(
    @SerialName("_id") val id: String,
    @SerialName("_source") val source: DataSusSource
)

@Serializable
data class DataSusSource(
    val estrangeiro: String? = null,
    val paisOrigem: String? = null,
    val paciente_endereco_uf: String? = null,
    val dataNotificacao: String? = null,
    val paciente_idade: Int? = null
)
