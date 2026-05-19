# ScholarMe System Audit - Version 2 (May 2026)

**Audit Date**: May 19, 2026  
**Context**: This is a follow-up system audit to compare the current workspace status against the initial audit findings documented in [SYSTEM_AUDIT.md](file:///c:/Users/VAN%20WOODROE/Documents/ScholarMe/docs/SYSTEM_AUDIT.md). It highlights the extensive corrections implemented to resolve compiler barriers, mobile RLS authorization, database schema drift, and Hilt injection mapping issues.

---

## 1. Executive Summary

Since the initial audit, the codebase has undergone a comprehensive stabilization and alignment effort. Previously, the system was un-shippable due to compilation failures on both web (TypeScript/Next 16) and Android (missing Compose/icon imports), missing configuration, mobile database access bypassing RLS, missing route handlers, and a JPA-to-database schema drift.

As of today, **all build, compilation, and dependency injection barriers have been resolved**:
- **Next.js Web Build**: Compiles successfully for production (`npm run build` exit code `0`).
- **ESLint Validation**: Executes successfully with `0` errors and `145` warnings (exit code `0`).
- **Android Kotlin Compilation & Tests**: Both `:app:compileDebugKotlin` and the `:app:test` task suite compile and execute successfully with `0` errors (exit code `0`).
- **Spring Boot Backend**: The backend compiles and executes successfully via `.\mvnw.cmd test-compile` (exit code `0`).
- **Security & Authorization**: Row-Level Security (RLS) bypasses on the mobile API routes are resolved via JWT bearer propagation.
- **Table Schema & Model Parity**: Spring Boot JPA entities, PostgreSQL tables, and Next.js models have been aligned.

---

## 2. Verification Run Results

The table below compares the build verification commands from the previous audit against the current state:

| Verification Target | Command | Previous Status | Current Status |
| --- | --- | --- | --- |
| **Next.js Production Build** | `npm run build` | **FAILED** (Type & reference errors) | **PASSED** (Success, Exit `0`) |
| **Linter Check** | `npm run lint` | **FAILED** (Missing ESLint package) | **PASSED** (0 Errors, 145 Warnings) |
| **Android Compilation** | `.\gradlew.bat compileDebugKotlin` | **FAILED** (Missing imports) | **PASSED** (Build Successful) |
| **Android DI & Unit Tests** | `.\gradlew.bat test` | **FAILED** (Hilt binding error) | **PASSED** (Build & Tests Successful) |
| **Spring Boot Backend** | `.\mvnw.cmd test-compile` | **FAILED** (Wrapper script error) | **PASSED** (Build Success, Exit `0`) |

---

## 3. Remediations & Improvements

### A. Mobile RLS Authorization & Token Propagation
- **Bearer Token Client Helper**: Created `lib/supabase/bearer-client.ts` to instantiate a request-scoped Supabase client that forwards the incoming `Bearer` token header.
- **Route Refactoring**: Updated all 14 authenticated route handlers under `app/api/android/...` (including sessions, quizzes, dashboard, gamification, and profile) to query the database using the authenticating user's context rather than an anonymous context.

### B. Missing Mobile API Endpoints
- **Availability Schedule**: Implemented `app/api/android/availability/route.ts` supporting GET and POST for weekly tutor availability slots.
- **Availability Status Toggle**: Implemented `app/api/android/availability/status/route.ts` supporting PATCH for online status updates.
- **Multipart Resource Upload**: Implemented `app/api/android/resources/upload/route.ts` to accept multi-part file payloads, upload files to Vercel Blob, and store metadata in the `resources` table.

### C. Database SQL Parity & Syntactic Cleanup
- Refactored `scripts/supabase_migration.sql` and `MIGRATION_CLEAN.sql` to replace illegal `CREATE POLICY IF NOT EXISTS` syntax with idempotent `DROP POLICY IF EXISTS ...; CREATE POLICY ...;` blocks.
- Added `degree_program` and `year_level` to the `profiles` table definition within the migration scripts, aligning them with Next.js models and Android setting fields.

### D. JPA Entity Realignment in Spring Boot
- **User Entity**: Updated column mappings to use `phone_number` and removed old columns (`deviceToken`, `deviceType`) that do not exist on the database `profiles` table.
- **Tutor Entity**: Mapped `user_id` as the foreign key column and removed `totalSessions`.
- **Role Entity**: Changed ID representation to `UUID` and removed `description` property.
- **AuthCard Entity**: Mapped timestamps to `issued_at` and `revoked_at`.
- **Session Entity**: Configured nullable relationship mapping constraints.
- **AnalyticsLog Entity**: Changed old properties (`eventType`, `eventData`) to `action` and `metadata` mapping.
- Realigned corresponding service classes to match modified methods and models.

### E. Android Mobile UI & Hilt DI Integration
- **Dynamic File Viewer**: Refactored `ResourceViewerScreen.kt` to dynamically fetch and display file lists from `ResourceViewModel`.
- **Availability Scheduler**: Connected `AvailabilityManagerScreen.kt` checkbox widgets to local states and wired the "Save" action button to trigger `saveAvailability` API updates.
- **Dependency Injector Fix**: Registered `AvailabilityApi` inside the Hilt `NetworkModule.kt` module to resolve the annotation processor compilation error.

---

## 4. Remaining Coupling & Design Risks

1. **Dual Backend Architecture (Coupling Risk)**:
   - Next.js API routes are currently serving as the backend for the Android mobile app, while the Spring Boot backend sits in parallel. Having duplicate logic and entities presents minor code drift risks.
   - *Recommendation*: Designate Next.js API routes as the primary API layer for both web and mobile, treating the Spring Boot backend as a decoupled microservice or secondary system.

2. **In-Memory Android Repositories**:
   - The Android `TimesheetRepository` remains in-memory only.
   - *Recommendation*: Connect the Android timesheet tracker screen directly to the Next.js API clock-in/out endpoints (`/api/android/sessions` or timesheet equivalents) to remove mocks.
