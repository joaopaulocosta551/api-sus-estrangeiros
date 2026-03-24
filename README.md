# SUS Attendance API (Foreigners)

REST API for managing and querying SUS (Unified Health System) attendance data for foreigners in Brazil.

## Technologies
- **Kotlin 2.1.0**
- **Spring Boot 3.4.3**
- **Java 22**
- **Spring Data JPA (Hibernate)**
- **PostgreSQL** (Production)
- **H2 Database** (Development/Testing)
- **Spring Security** (Basic Auth)
- **SLF4J/Logback** (Logging)
- **Gradle Kotlin DSL**

## Project Refactoring
The project has been refactored to follow international standards:
- **Language**: All classes, methods, and variables renamed from Portuguese to English.
- **Package Organization**: Improved structure with specific packages for controllers, services, repositories, entities, and configurations.
- **Security**: Added Spring Security with Basic Authentication.
- **Logging**: Integrated SLF4J for better traceability.
- **Transactional**: Proper use of `@Transactional` for atomic database operations.

## Database Configuration

### Production (PostgreSQL)
For production environments, PostgreSQL is the recommended database. Update `src/main/resources/application.properties` with your credentials:

```properties
spring.datasource.url=jdbc:postgresql://your-host:5432/sus_db
spring.datasource.username=your-user
spring.datasource.password=your-password
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
```

### Development (H2)
By default, the project uses H2 in-memory database for rapid development. The H2 console is available at `/h2-console`.

## Security
The API is protected with Basic Authentication.
- **Default Username**: `admin`
- **Default Password**: `admin123`

## Endpoints
- `GET /api/attendances`: List all attendances.
- `GET /api/attendances/{id}`: Find attendance by ID.
- `GET /api/attendances/country/{country}`: Filter by country.
- `GET /api/attendances/state/{state}`: Filter by state.
- `POST /api/attendances`: Create a new attendance record.
- `DELETE /api/attendances/{id}`: Remove an attendance record.

## How to Run
1. Clone the repository.
2. Ensure you have Java 22 installed.
3. Run `./gradlew bootRun`.
