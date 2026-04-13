package com.joaopaulo.sus.infrastructure.client

import com.joaopaulo.sus.infrastructure.client.dto.*
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.engine.cio.*
import io.ktor.client.plugins.auth.*
import io.ktor.client.plugins.auth.providers.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.Json
import org.springframework.stereotype.Component

@Component
class OpenDataSusClient {

    private val client = HttpClient(CIO) {
        install(ContentNegotiation) {
            json(Json {
                ignoreUnknownKeys = true
                coerceInputValues = true
            })
        }
        install(Auth) {
            basic {
                credentials {
                    BasicAuthCredentials(
                        username = "user-public-notificacoes",
                        password = "Za4qNXdyQNSa9YaA"
                    )
                }
                sendWithoutRequest { it.url.host == "notifica-prd-es.saude.gov.br" }
            }
        }
    }

    suspend fun fetchEstrangeiros(from: Int, size: Int): OpenSearchResponse {
        val response = client.post("https://notifica-prd-es.saude.gov.br/desc-esus-notifica-estado-sp/_search") {
            contentType(ContentType.Application.Json)
            setBody(
                OpenSearchRequest(
                    from = from,
                    size = size,
                    query = OpenSearchQuery(QueryString("estrangeiro"))
                )
            )
        }
        return response.body()
    }
}
