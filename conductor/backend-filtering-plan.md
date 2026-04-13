# Backend Filtering Plan: Dynamic Queries with JPA Specifications

## Objective
Enhance the existing `GET /api/attendances` endpoint to support dynamic, multi-parameter filtering (e.g., by year, month, country, and state) using Spring Data JPA Specifications. This approach provides a flexible, scalable way to query the database without creating a separate endpoint for every possible combination of filters.

## Key Files & Context
- `src/main/kotlin/com/joaopaulo/sus/repository/AttendanceRepository.kt`
- `src/main/kotlin/com/joaopaulo/sus/service/AttendanceService.kt`
- `src/main/kotlin/com/joaopaulo/sus/controller/AttendanceController.kt`
- New file: `src/main/kotlin/com/joaopaulo/sus/repository/specification/AttendanceSpecification.kt`

## Implementation Steps

### 1. Update Repository
- Modify `AttendanceRepository` to extend `JpaSpecificationExecutor<SusAttendance>` in addition to `JpaRepository`. This enables the repository to execute dynamic queries built with the Criteria API.

### 2. Create Specification Class
- Create `AttendanceSpecification.kt` to define the dynamic query building logic.
- Implement a method (e.g., `buildFilter`) that takes optional parameters (`year`, `month`, `country`, `state`) and constructs a `Specification<SusAttendance>`.
- The logic will dynamically append `WHERE` clauses (using `criteriaBuilder.equal`) only for the parameters that are provided (not null/blank).

### 3. Update Service Layer
- Modify `AttendanceService.findAll()` to accept optional parameters: `year: Int? = null`, `month: Int? = null`, `country: String? = null`, `state: String? = null`.
- Update the method to call `repository.findAll(AttendanceSpecification.buildFilter(...))` and map the results to `AttendanceResponse` objects.

### 4. Update Controller Layer
- Modify `AttendanceController.findAll()` to accept the optional parameters using `@RequestParam(required = false)`.
- Pass these parameters down to the `AttendanceService`.
- (Optional) Consider deprecating or removing the existing specific endpoints (`/country/{country}`, etc.) if the new dynamic `/api/attendances` endpoint covers all use cases effectively.

## Verification & Testing
- Start the application and use `curl` or Postman to test various combinations of query parameters:
  - `GET /api/attendances?country=Venezuela`
  - `GET /api/attendances?state=SP&year=2023`
  - `GET /api/attendances` (should return all records)
- Ensure the application compiles correctly and the tests pass. Update `AttendanceControllerTest.kt` to test the new dynamic filtering capabilities.
