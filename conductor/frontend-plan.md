# Frontend Implementation Plan: Next.js Dashboard

## Objective
Develop a Next.js web application to visualize, manage, and import SUS attendance data for foreigners in Brazil, seamlessly integrating with the existing Kotlin Spring Boot REST API.

## Key Features & Structure

1. **Dashboard (`/`)**
   - High-level visualizations for attendances (e.g., by country, state, and timeline).
   - KPI Cards (Total records imported).
   
2. **Data Explorer (`/data`)**
   - Tabular view of raw `attendances` data.
   - Quick filters using the existing API endpoints (`/country`, `/state`, `/period`).

3. **Import Management (`/import`)**
   - User interface to trigger the `POST /api/attendances/import` endpoint.
   - Progress/Status feedback for the batch processing.

## Tech Stack
- **Framework**: Next.js (App Router) + React.
- **Language**: TypeScript.
- **Styling**: Vanilla CSS Modules (to maintain a clean and lightweight footprint).
- **Visualizations**: `recharts` (a reliable and easy-to-use React charting library).
- **HTTP Client**: Native `fetch`.

## Implementation Steps
1. **Initialize Project**: Scaffold a new Next.js application inside a `frontend` directory within the project root (`npx create-next-app@latest`).
2. **Backend Configuration (CORS)**: Update the Spring Boot API to accept Cross-Origin Resource Sharing (CORS) requests from the Next.js local server (`http://localhost:3000`).
3. **API Client & Types**: Define TypeScript interfaces (`AttendanceResponse`) mirroring the Kotlin DTOs and create utility functions for `fetch`.
4. **UI Components Construction**: Build reusable UI components (Buttons, Tables, StatCards, Layout Navigation).
5. **Page Development**: Implement the core routes (`/`, `/data`, `/import`).
6. **Integration**: Wire the frontend components directly to the local Spring Boot server endpoints.

## Verification
- Verify the frontend successfully compiles without TypeScript errors.
- Confirm successful data retrieval from the Spring Boot API (bypassing CORS issues).
- Verify the manual import trigger functions correctly through the UI.