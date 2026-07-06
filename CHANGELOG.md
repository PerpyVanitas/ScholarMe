# Changelog

## [2026-07-06] - Audit Remediation (Phase 3: Deep Dive)

### Added

- Added "Save Draft" functionality to Finance Forms (Budget Requests and Petty Cash) to allow submitters to iterate on requests before sending them for manager review.
- Created `lib/analytics.ts` as a telemetry wrapper for future integration with analytics platforms.

### Changed

- Refactored `lib/user-context.tsx`, `profile/page.tsx`, and `analytics/page.tsx` to replace `any` types with proper Type definitions.
- Optimized database queries in `lib/tutors/db.ts`, `app/dashboard/availability/page.tsx`, and `app/dashboard/finance/page.tsx` by replacing blanket `.select("*")` calls with explicitly required columns.
- Standardized the Design System by refactoring hardcoded tailwind colors in the landing page to use the global CSS Variables `hsl(var(--primary))`.
- Improved the empty states on the Tutors browsing page.

## [2026-07-06] - Audit Remediation (Phase 2: Refactoring)

### Changed

- Refactored `app/dashboard/admin/users/page.tsx` (God Object) by extracting all modal states into `components/user-create-dialog.tsx`, `components/user-edit-dialog.tsx`, `components/user-delete-dialog.tsx`, `components/user-logs-dialog.tsx`, `components/user-designations-dialog.tsx`, and `components/user-id-card-dialog.tsx`.
- Refactored `app/dashboard/profile/page.tsx` (God Object) by extracting all modal states into `components/profile-edit-dialog.tsx`, `components/tutor-settings-dialog.tsx`, and `components/honor-society-designation-dialog.tsx`.
- Ensured all refactored pages are completely type-safe.

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Tutor Analytics System**: Introduced database extensions to track tutor metrics (sessions completed, hours tutored, response rate).
- **Tutor Analytics Dashboard**: Added a dedicated `Tutor Analytics` page under Admin Tools featuring a tutor leaderboard and graphical performance charts.
- **Admin Dashboard Improvements**: Added Active Tutors KPI to the primary Admin Dashboard.
- **Super Admin Feedback System**: New `/api/feedback` endpoint to capture user reports, and a `/dashboard/admin/feedback` interface exclusively for Super Admins to review feedback.
- Added "User Feedback" link to the Super Admin sidebar navigation.

### Changed

- **Polls UI**: Transformed the inline Poll History list on the voting page into a cleaner Dialog Modal.

### Fixed

- **Security**: Patched Next.js dependencies to `16.2.5+` resolving multiple High severity cache-poisoning and CSRF vulnerabilities flagged by `pnpm audit`.
- **Orphaned Admin Pages**: Integrated the previously inaccessible `Role Management` and `ID QR Scanner` tools directly into the Admin Sidebar and Admin Dashboard Quick Links.
- **Tutor Analytics Bug**: Authored a Postgres SQL Trigger (`20260706173500_tutor_analytics_trigger.sql`) to automatically calculate and increment a tutor's `total_sessions_completed`, `total_hours_tutored`, and `total_students_helped` in real-time when a session status is marked as 'completed'.
- **Mobile Responsiveness**: Fixed several layout bugs causing the UI to clip or stretch horizontally on mobile devices.
  - Wrapped data tables in the Admin Sessions, Logs, and Users pages with `overflow-x-auto` to allow horizontal scrolling on small screens.
  - Adjusted rigid grid layouts on the Analytics page to scale down to a single column on phones before expanding to multiple columns on tablets and desktops.
- **Critical Security (IDOR)**: Fixed a Broken Object Level Authorization vulnerability in the Teamwork tracker. Restricted `team_tasks` RLS and added server-side verification to `app/actions/team.ts` so that only Officers can modify executive tasks.
- **Critical Security (Finance)**: Authored a Postgres Migration (`20260706180000_patch_finance_security.sql`) to completely lock down the `finance_budget_requests`, `finance_liquidations`, `finance_petty_cash`, and `finance_scards` tables. Prior to this patch, ANY authenticated user could theoretically view and mutate all organizational financial data due to permissive `USING (true)` policies.
- **TypeScript Build Error**: Resolved a fatal type clash in `app/dashboard/tutors/page.tsx` that was causing Vercel builds to fail (`Property 'name' does not exist on type 'never'`).
- **Orphaned Features**:
  - Linked the previously inaccessible `/dashboard/team` Teamwork Workspace into the primary app sidebar for Officers and Admins.
  - Linked the completely orphaned `/dashboard/finance` Finance Module into the primary app sidebar so that Finance Managers, Treasurers, and Auditors can actually access it.
- **Gamification**: Upgraded the Tutor Analytics trigger to automatically award Tutors 50 XP to their `profiles` for every hour of tutoring they complete!
- **Tutor Onboarding**: Improved the tutor profile setup flow by making it mandatory to provide a Bio and select at least one Specialization during registration. The "Skip for now" option is removed for Tutors, and fields for Hourly Rate and Years of Experience are now collected upfront.
- **Find Tutors Logic**: Updated API and client-side filtering to ensure Learner, Admin, and Super Admin accounts do not appear on the Find Tutors page.
- **Audit Findings Remediation**:
  - Replaced numerous empty `catch {}` blocks across the codebase with structured error logging.
  - Authored SQL migration to fix the `profiles` table Row Level Security (RLS) leak to prevent PII exposure.
- Comprehensive Code Audit Report detailing Security (OWASP Top 10), Code Quality, and Performance findings.
- Android Native Gamification integration (XP triggers, Dynamic Leaderboards, Level-colored Avatar Borders).
- Android Native AI Generation Screens (`QuizCreateScreen`, `FlashcardCreateScreen`).
- Android Native Honor Society Designations rendered on the Profile screen alongside the Digital ID Card.
- Exponential XP Scaling Curve database migration and recalculation logic (`Level = FLOOR(0.1 * SQRT(total_xp)) + 1`).
- Swagger/OpenAPI Documentation to Spring Boot controllers.
- Spring Boot Actuator Health Endpoint.
- Structured Request Logging with Correlation IDs in Spring Boot (`RequestLoggingFilter`).
- Server-side gamification XP validation and anti-cheat mechanism.
- Android Network Security Configuration to block cleartext traffic.
- Android ProGuard rules for Retrofit and Hilt to prevent aggressive stripping.
- Environment variable startup validation for Next.js (`lib/env.ts`).
- React component-level Error Boundaries around major dashboard sections.
- Accessibility audit step (`axe-core`) to CI pipeline.
- Vercel production deployment step to CI pipeline.
- Secrets scanning (TruffleHog) to CI pipeline.
- This `CHANGELOG.md` file.
- `CONTRIBUTING.md` guidelines.

### Changed

- Enforced strict Role-Based Access Control (RBAC) tying the `super_admin` designation explicitly to the user's role rather than a hardcoded email.
- Updated README.md to reflect recent updates to Gamification, Organization Voting, and Dynamic ID Cards.
- Completely refactored Next.js `app-sidebar.tsx` with rigorous Role-Based Access Control and categorized navigation groups (Core, Academics, Community, Tools).
- Refactored `rate-limit.ts` from in-memory Map to Supabase backing store to prevent state loss on serverless cold starts.
- Enforced TypeScript `strict: true` across the Next.js app.
- Relocated `lib/demo.ts` to `scripts/demo.ts` with production safety warnings.
- Migrated `.gitignore` to comprehensively exclude debug scripts and build artifacts.
- Improved Spring Security CORS and CSRF configurations.

### Removed

- `middleware.ts` (renamed to `proxy.ts` for Next.js 16.1+ App Router conventions).
- Unused dependencies (`@ai-sdk/google`, `ai`, `mammoth`, `officeparser`, `pdf-parse`).
- Misplaced development artifacts from the root directory (`scratch_*.mjs`, `fetch_*.js`, etc.).
- Deprecated React Native mobile client code from `mobile/` directory.

### Performance

- Added database indexes (`supabase/migrations/`) to optimize commonly queried columns on `sessions`, `auth_cards`, `resources`, and `analytics_logs`.
