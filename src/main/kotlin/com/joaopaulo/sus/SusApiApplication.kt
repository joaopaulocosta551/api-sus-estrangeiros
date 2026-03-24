package com.joaopaulo.sus

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class SusApiApplication

fun main(args: Array<String>) {
    runApplication<SusApiApplication>(*args)
}
