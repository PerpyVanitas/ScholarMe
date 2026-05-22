# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
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
