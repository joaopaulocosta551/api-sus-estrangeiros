# API SUS - Atendimentos a Estrangeiros 🏥🇧🇷

Este é um projeto pessoal desenvolvido em **Kotlin** com **Spring Boot** para processar, armazenar e disponibilizar dados estatísticos sobre atendimentos do Sistema Único de Saúde (SUS) realizados em cidadãos estrangeiros. 

A fonte primária de dados para este projeto é o **DATASUS**, visando transformar dados brutos em uma API REST de fácil consumo.

---

## 🛠️ Tecnologias Utilizadas

O projeto utiliza o que há de mais moderno no ecossistema Java/Kotlin:

- **Linguagem:** [Kotlin 2.1.0](https://kotlinlang.org/)
- **Framework:** [Spring Boot 3.4.3](https://spring.io/projects/spring-boot)
- **JDK:** [Java 22](https://openjdk.org/projects/jdk/22/)
- **Persistência:** [Spring Data JPA](https://spring.io/projects/spring-data-jpa) (Hibernate)
- **Bancos de Dados:** 
  - **H2 (Memória):** Utilizado para desenvolvimento e testes rápidos.
  - **PostgreSQL:** Suporte nativo para ambientes de produção.
- **Testes:** JUnit 5, Mockito e MockMvc.
- **Gerenciador de Dependências:** Gradle (Kotlin DSL).

---

## 🏗️ Arquitetura do Projeto

A aplicação segue o padrão de camadas (Layered Architecture):

1.  **Entity (`AtendimentoSus`):** Mapeamento do banco de dados (Ano, Mês, País, Estado, Quantidade).
2.  **Repository (`AtendimentoRepository`):** Interface JPA para operações de CRUD e consultas customizadas.
3.  **Service (`AtendimentoService`):** Camada de lógica de negócio e intermediação.
4.  **Controller (`AtendimentoController`):** Exposição dos endpoints REST.

---

## 🚀 Como Executar o Projeto

Certifique-se de ter o JDK 22 instalado em sua máquina.

### Rodar a aplicação:
```bash
./gradlew bootRun
```
*A API estará disponível em: `http://localhost:8081`*

### Rodar os testes:
```bash
./gradlew test
```

---

## 📡 Endpoints da API

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/atendimentos` | Lista todos os registros. |
| `GET` | `/api/atendimentos/{id}` | Busca um registro por ID único. |
| `GET` | `/api/atendimentos/pais/{pais}` | Filtra atendimentos por país de origem. |
| `GET` | `/api/atendimentos/estado/{uf}` | Filtra atendimentos por estado (ex: SP, RJ). |
| `POST` | `/api/atendimentos` | Cadastra um novo registro de atendimento. |
| `DELETE` | `/api/atendimentos/{id}` | Remove um registro do banco de dados. |

---

## 🔍 Ferramentas de Desenvolvimento

### Console do Banco H2
Durante o desenvolvimento, você pode visualizar os dados em tempo real através do console web:
- **URL:** `http://localhost:8081/h2-console`
- **JDBC URL:** `jdbc:h2:mem:susdb`
- **Usuário:** `sa` (sem senha)

### Logs de SQL
As queries geradas pelo Hibernate são formatadas e exibidas no terminal para facilitar a depuração e otimização de consultas.

---

## 📈 Próximos Passos (Roadmap)
- [ ] Implementar serviço de importação de arquivos CSV do DATASUS.
- [ ] Adicionar documentação interativa com **Swagger/OpenAPI**.
- [ ] Criar filtros avançados por período (ano/mês).
- [ ] Implementar segurança com Spring Security (Opcional).

---

**Desenvolvido por João Paulo Silva Costa** 🚀
