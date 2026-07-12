## [2026-07-12] - QA Audit & Production Build Fixes

### Fixed

- **Production Build Issues**: Resolved multiple severe build-breaking bugs involving Next.js route handlers incorrectly exporting helper functions, strict TypeScript compilation errors across page boundaries, and Webpack conflicts.
- **WebLLM Imports**: Fixed absolute pathing for local AI Web Worker threads ensuring successful static compilation in the PWA environment.

### Changed

- **UI/UX QoL Updates**:
  - Replaced native `confirm()` browser alerts in Quizzes and Flashcards with Radix UI `Dialog` modals for a smoother study experience.
  - Expanded the `QuizItemsEditor` maximum height to 600px for easier bulk editing.
  - Implemented a real-time visual progress bar for WebLLM model initializations, providing vital feedback during the heavy download phase.

## [2026-07-12] - Free Local AI (WebLLM) Integration### Changed

- **Manual Flashcards & Quizzes**: Replaced the server-side Gemini fallback with the completely free, unlimited `WebWorkerMLCEngine` (Local AI). This guarantees no API usage costs when users manually prompt to generate flashcards or quizzes.

### Added

- **API Rate Limiting**: Added Supabase-backed sliding-window rate limiting to the remaining Gemini-powered document extraction API endpoints (`generate-from-resource` and `extract-topics`). Users are strictly limited to 2 generation requests per minute.
- **Frontend Debouncing & Cooldowns**: Implemented UI cooldown states for the 'From Resource' tabs in Flashcards and Quizzes. If a user hits the rate limit, the Generate button turns into a live 60-second countdown timer, preventing accidental button mashing and API spam.

## [2026-07-12] - System Audit & Stability Fixes (Batch 4)

### Fixed

- **God Objects Refactored**: Extracted large UI components into modular, manageable chunks for `create-quiz-sheet.tsx`, `profile/page.tsx`, `analytics/page.tsx`, `chat-interface.tsx`, and `sessions/page.tsx`.
- **Integrations Save Bug**: Re-wrote `saveIntegration` action to use a safe select/update/insert flow instead of an unsafe `upsert` on a non-unique column, fixing the bug that prevented saving configurations.
- **Mock Data Elimination**: Replaced mocked payload data in `daily-quests.tsx`, `integrations/actions.ts`, and `finance-actions.ts` with authentic Supabase queries for gamification and payroll.
- **UX Error Handling**: Executed a global pass converting 23+ instances of raw `console.error` into user-facing `toast.error()` notifications, preventing silent failures.

## [2026-07-12] - System Audit & Stability Fixes (Batch 3)

### Fixed

- **Integrations Dashboard**: Wired Canvas save, webhook CRUD, and payroll export to real DB tables (`integration_configs` and `attendance_logs`) instead of mock data.
- **Admin Migrations Endpoint**: Added `exec_sql` RPC function migration and wired the REST API execution path to fix the broken migration endpoint.
- **Gamification Actions**: Refactored `earnXp` calls across the app to strictly use `XP_AWARDS` constant strings instead of arbitrary numbers. Added missing constants (`SECRET_EGG_FOUND`, `QUIZ_CREATED`).
- **Daily Gamification Decay**: Wired the `gamification/daily` logic directly into the user login flow so inactive users correctly lose XP automatically.
- **Accessibility Settings**: Removed the fake language switcher that wasn't doing anything due to lack of an i18n framework.
- **Theme Color**: Updated `manifest.ts` to read `theme_color` from `NEXT_PUBLIC_THEME_COLOR` for white-labeling support.
- **Weekly Challenges**: Added missing `weekly_challenges` table migration with proper RLS policies.
- **Cleanup**: Deleted unused/orphaned `offline-storage.ts` script.

## [2026-07-12] - Advanced Study Sets & UI Customization

### Added

- **Export Flashcards**: Added `/api/quizzes/[id]/export` endpoint to export Study Sets to CSV compatible with Anki/Quizlet.
- **Text-to-Speech (TTS)**: Added browser native speech synthesis buttons for flashcard questions and answers in Study mode.
- **Typing Mode**: Added a toggle for Spelling/Typing mode where learners must type out exactly the flashcard answer.
- **Confidence Ratings (SM2)**: Replaced standard self-grading for flashcards with Again/Hard/Good/Easy buttons for SRS.
- **Live Chat Support**: Implemented a global floating `SupportChatWidget` for users to directly reach Super Admins via real-time messaging, with an Inbox for admins in the dashboard.
- **Public Roadmap**: Added `/dashboard/roadmap` where users can view Planned, In Progress, and Completed features and upvote them.
- **White-labeling**: Added Organization Settings dashboard for Admins to customize the global primary theme color, logo, and Landing Page Hero text.
- **Image Occlusion**: Added ability to upload an image URL to flashcards and draw interactive occlusion masks that hide visual parts, which users can click to reveal during study sessions.

## [2026-07-12] - QA Bug Fixes

## [2026-07-12] - Messaging & Community QoL Features

### Added

- **Messaging Upgrades**: Added Read receipts, Pin messages, Threaded replies support, and Chat search within conversation.
- **Study Buddy Matching**: Created `/dashboard/network/study-buddies` to let users find peers in the same degree program and year level.
- **Alumni Directory**: Created `/dashboard/network/alumni` to connect students with graduates.
- **Tutor Office Hours**: Added an "Office Hours" toggle in the create session form for tutors, allowing them to host drop-in group sessions marked specifically as Office Hours.
- **Finance Module**: Implemented multi-step approvals, OCR receipt parsing support, budget progress bars, partial liquidations, vendor directory, and email/in-app notifications.

### Fixed

- **CSP WebAssembly Error**: Updated `proxy.ts` Content-Security-Policy to allow `'unsafe-eval'` in production to fix the AI Tutor crash.
- **AI Tutor Error Handling**: Added toast notifications when WebLLM initialization fails so users are informed instead of silently failing.
- **Mobile Navigation**: Unhid the `SidebarTrigger` on mobile screens to restore access to Forums, Voting, Leaderboards, and Messages via the mobile drawer.
- **Resources Mobile Rendering**: Fixed horizontal layout overflow on mobile resource cards that caused blank screens when previewing files.
- **Forums & Study Group Server Errors**: Added `maxLength` and CSS word breaking to creation forms to prevent Postgres constraint crashes when users type continuous characters.
- **Messages Attachments**: Fixed the chat sidebar incorrectly displaying "no messages yet" when a file was sent, and added the HTML5 `download` attribute to attachment links to ensure they download properly.

## [2026-07-07] - Phase 29 QoL Sprint: Final Backlog Completion

### Added

- **Study Group Chat**: Real-time group messaging via `study_group_messages` with Supabase Realtime on the group detail page.
- **Group Session Join Flow**: Learners can browse open group sessions and join via `/api/sessions/[id]/join`; sessions page shows an "Open Groups" tab.
- **Real System Health Metrics**: `/api/admin/health` returns live row counts from key tables; health dashboard displays real data.
- **Analytics Persistence**: `lib/analytics.ts` writes events to `analytics_logs` via `/api/analytics/track`; dashboard tracks page views.
- **Peer Review Consolidation**: Tutor detail peer reviews now use `tutor_reviews`; migration backfills from legacy `tutor_peer_reviews`.

### Changed

- **Session RLS**: Added policies for browsing open group sessions and viewing joined participant sessions.
- **Sessions Page**: Merges owned and participant sessions for learners.

## [2026-07-07] - Phase 28 QoL Sprint: Missing Features Completion

### Added

- **Organization Forums (full CRUD)**: Users can create discussions, view post details, and reply. Linked in sidebar.
- **Study Groups (create + detail)**: Enabled group creation, member detail page with DM links, sidebar navigation.
- **Group Session Booking**: Learners can select group size (1–5) when booking; API respects `max_participants`.
- **Prep Notes on Booking**: Separate prep notes field distinct from session notes in the booking dialog.
- **Login History Recording**: Sign-in and OAuth callback now insert `login_history` rows.
- **Automatic Badge Unlocking**: Quiz perfect scores, night-owl study, and 7-day streaks unlock badges.
- **Tutor Strikes**: Incremented when a session is marked no-show.
- **Syllabus Event Persistence**: AI-parsed syllabus events are saved to `facility_events`.
- **QoL Tracker**: Recreated `unimplemented_qol_features.md` as a living backlog document.

### Fixed

- **Account Data Export**: Corrected table names (`study_sets`, `sessions`, `hs_designations`).
- **Admin CSV Export**: Fixed `finance_budget_requests` table and column names to match schema.

### Changed

- **Sidebar Navigation**: Added Forums, Study Groups, Peer Reviews, Data Export, System Health, Mastery Verifications, and Cash Register links.

## [2026-07-07] - Phase 27.5 QoL Sprint: Peer Review & Tutor Substitution

### Added

- **Peer Review & Mentorship**: Added is_lead_tutor flag and a dedicated /dashboard/tutors/reviews dashboard. Lead tutors can write evaluations (1-5 stars + feedback) for junior tutors to read.
- **Tutor Substitution Flow**: Tutors can now initiate a "Substitute" request on a confirmed session, selecting another available tutor to take over. The target tutor receives a pending alert in their session list to accept or decline the transfer.
- **Rescheduling Flow**: Improved the Tutor Reschedule action to send a proposed new time to the Learner instead of instantly overwriting the session. The learner can accept or decline the new proposed time.

## [2026-07-07] - Phase 27 QoL Sprint: Tutor Experience Enhancements

### Added

- **Customizable Dashboard Layout**: Integrated @dnd-kit to allow tutors to drag-and-drop their dashboard widgets (Overdue Sessions, Clock-in, Stats, and Layout Grid). Layouts are automatically saved to their profile.
- **Auto-Clock Out Protection Alert**: The Tutor Dashboard now visually alerts the user with a warning banner if they have been clocked in for more than 12 hours consecutively.
- **Calendar Syncing**: Tutors can now generate a personal .ics Subscription URL for their confirmed sessions, exportable directly from their Profile Settings.
- **Auto-Approve Past Learners**: Added a toggle for tutors to automatically approve session requests from learners they have previously had completed sessions with.
- **Subject Mastery Verification**: Tutors can now submit "Verification Claims" for specific specializations (e.g., transcripts) which Admins can review and approve in a new dmin/verifications dashboard.

# Changelog

## [2026-07-07] - Phase 26 QoL Sprint: Announcements & Library Reminders

### Added

- **Automated Reminders API**: Created a serverless endpoint (`/api/admin/cron/reminders`) that functions as a Cron Job to sweep for upcoming Event RSVPs and Overdue Library Books.
- **Email Notifications**: Integrated mock email capabilities (via Resend) to dispatch customized HTML emails alerting users of upcoming events and overdue checkouts.
- **Admin Digest (Discord)**: Intercepts completion of the Cron job and posts a summary report to the Admin Discord Webhook.
- **Manual Trigger UI**: Added a "Trigger Now" button to the System Health dashboard to allow Admins to manually run the reminder sweep.

## [2026-07-07] - Phase 25 QoL Sprint: UI Polish

### Added

- **Illustrated Empty States**: Added Lucide icon illustrations with dynamic blur backgrounds to empty states in TutorDashboard.
- **Form Warning (Unsaved Changes)**: Implemented a warning system for unsaved changes in `ProfileEditDialog` and `TutorSettingsDialog` to prevent accidental data loss.
- **Tooltips for Icon Buttons**: Added Shadcn Tooltips to `ThemeToggle`, `FeedbackButton`, and `ScrollToTopFab` and registered a `TooltipProvider` globally in `app/layout.tsx`.

## [2026-07-07] - Phase 21: Library Management & Learner QoL

### Added

- **Library Database Schema**: A new migration was created (`20260706195603_phase_21_library_and_waitlists.sql`) adding support for physical resources (`physical_resources`), tracking of checked out items (`resource_checkouts`), and session waitlists (`session_waitlists`).
- **Library Catalog**: Created a new Library Catalog page (`/dashboard/resources/library`) featuring a complete inventory view, 'Add Resource' modal for Admins, and barcode scanning integration (`html5-qrcode`) for ISBN lookups.
- **Resource Checkout Workflow**: Added a `CheckoutModal` allowing Admins to checkout resources to Learners with specified return dates, tracking available quantities in real-time.
- **Smart Tutor Recommendations**: Integrated intelligent tutor matching in the Learner Dashboard (`SmartTutorRecommendations` component) based on subject availability.
- **Quick Rebook**: Added a "Rebook" action within Learner Session History for rapid re-booking of previous tutors.
- **Waitlists**: Built Server Actions and UI for users to join Waitlists when tutors are fully booked.
- **Interactive Campus Map**: Built a `CampusMapModal` accessible from the Library Catalog page to visually guide users to physical resources and the tutoring center.

## [2026-07-07] - QoL Feature Audit (Phases 1-4)

### Added

- **Global Command Palette**: Implemented `cmdk` for lightning-fast global navigation (Cmd+K).
- **Gamification Enhancements**: Added daily study streak tracking, customized level badge contrast, and integrated `canvas-confetti` and `driver.js` for an interactive product tour.
- **Physical Library Catalog**: Created a new database schema and UI to search and track physical book inventory (`physical_books`).
- **Announcement Calendar**: Added a dynamic calendar view for tracking facility events (`facility_events`), integrating `date-fns` and Shadcn's Calendar.
- **Bulk ID Exporter**: Admin can now select multiple users and export their ScholarMe ID cards simultaneously as a single PDF using `html2canvas` and `jspdf`.
- **Discord Webhook Integration**: Created an API route `/api/webhooks/discord` to broadcast system notifications (new users, announcements, resources) to external channels.

### Changed

- **Sidebar De-bloating**: Reorganized the main App Sidebar to neatly group Study Tools, Community, and Admin management for better UX.
- **Loading UI**: Introduced modern `Skeleton` loaders across dashboard views to improve perceived performance.

## [2026-07-07] - Codebase Optimization & DDD Migration

### Changed

- **Domain-Driven Design (DDD) Migration**: Successfully migrated the application from a heavily nested `lib/` directory into a clean, modular `features/` architecture. This grouped database logic, components, and server actions by their respective domains (`admin`, `finance`, `profiles`, `quizzes`, `sessions`, `tutors`).
- **Codebase Optimization**: Conducted a deep codebase cleanup pass removing orphaned files, single-use scripts (`fix-catches.js`, `fix-server-ts.mjs`), and empty directories (`docs`, `lib/prompts`) left over from the DDD migration.
- **Documentation**: Updated the `README.md` to accurately reflect the new `features/` directory architecture and updated component structures.

## [2026-07-06] - Audit Remediation (Phase 3: Deep Dive)

### Added

- Added "Save Draft" functionality to Finance Forms (Budget Requests and Petty Cash) to allow submitters to iterate on requests before sending them for manager review.
- Created `lib/analytics.ts` as a telemetry wrapper for future integration with analytics platforms.

### Changed

- Refactored `lib/user-context.tsx`, `profile/page.tsx`, and `analytics/page.tsx` to replace `any` types with proper Type definitions.
- Optimized database queries in `lib/tutors/db.ts`, `app/dashboard/availability/page.tsx`, and `app/dashboard/finance/page.tsx` by replacing blanket `.select("*")` calls with explicitly required columns.
- Standardized the Design System by refactoring hardcoded tailwind colors in the landing page to use the global CSS Variables `hsl(var(--primary))`.
- Improved the empty states on the Tutors browsing page.
- Refactored `app/dashboard/voting/page.tsx` by extracting `CreatePollForm`, `EditPollDialog`, and `PollResultsDialog` and implemented dynamic loading.
- Refactored `app/dashboard/admin/analytics/page.tsx` by extracting `TutorAnalyticsTab` and `SystemAnalyticsTab` into dedicated components and implemented dynamic loading to reduce bundle size.
- Replaced wildcard `.select("*")` queries with explicit column selections in `/api/timesheets/periods`, `/api/resources/extract-topics`, `/api/quizzes/generate-from-resource`, `/api/admin/users/designations`, and `/api/admin/users/[id]/logs`.
- Resolved critical `react-hooks/set-state-in-effect` warnings in `lib/user-context.tsx` and `use-realtime-messages.ts` that were causing unwanted cascading renders and potential UI tearing.
- Swept the codebase to fix numerous `@typescript-eslint/no-explicit-any` violations in the `apiClient` library and `admin-charts` components.
- Fixed non-performant `<img>` tags in `chat-interface.tsx`.

## [2026-07-06] - Audit Remediation (Phase 2: Refactoring)

### Changed

- Refactored `app/dashboard/admin/users/page.tsx` (God Object) by extracting all modal states into `components/user-create-dialog.tsx`, `components/user-edit-dialog.tsx`, `components/user-delete-dialog.tsx`, `components/user-logs-dialog.tsx`, `components/user-designations-dialog.tsx`, and `components/user-id-card-dialog.tsx`.
- Refactored `app/dashboard/profile/page.tsx` (God Object) by extracting all modal states into `components/profile-edit-dialog.tsx`, `components/tutor-settings-dialog.tsx`, and `components/honor-society-designation-dialog.tsx`.
- Ensured all refactored pages are completely type-safe.
- Refactored `app/dashboard/finance/page.tsx` (God Object) by extracting all tabs into their own components (`budget-requests-tab.tsx`, `petty-cash-tab.tsx`, `liquidations-tab.tsx`, `scards-tab.tsx`).
- Refactored `app/dashboard/quizzes/page.tsx`, `app/dashboard/flashcards/page.tsx`, and `app/dashboard/resources/page.tsx` (God Objects) by extracting large creation sheets and modals into modular components (`create-quiz-sheet.tsx`, `create-flashcards-sheet.tsx`, `resource-upload-sheet.tsx`, etc.).
- Dynamically imported the newly extracted modal components in Quizzes, Flashcards, and Resources using `next/dynamic` for better lazy loading and reduced initial bundle size.
- Improved TypeScript strictness by replacing unstructured `any` types in refactored components with explicit types and replacing empty `catch(e)` blocks with proper `unknown` typing.

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
- Created database migration (`20260706183030_schema_cleanup.sql`) to clean up duplicate columns in `study_sets`, enforce `ON DELETE CASCADE` for critical relational tables (e.g., polls, study set items), and added indexes on foreign keys to prevent full table scans and improve query speeds.

## [2026-07-06] - Architecture & DDD Refactoring

- **Refactor**: Reorganized project structure from layered (components/dashboard/, lib/ specific) to Domain-Driven Design under the eatures/ directory.
- **Moved**: Extracted profiles, sessions, quizzes, study-sets, tutors, finance, and admin domains into eatures/ directory.
- **Fixed**: Successfully remediated all import paths globally to fix sc and lint errors.
- **Cleaned**: Removed dead code, optimized imports, and eliminated
  eact-hooks/exhaustive-deps warnings across the dashboard.

### 2026-07-07

- Implemented Flashcard Spaced Repetition (SRS) integration in the frontend.
- Implemented Study Groups feature with a new dashboard page for discovering and joining groups.
- Implemented AI Quiz Flagging feature allowing users to flag inaccurate AI-generated questions.
- Implemented Recurring Sessions functionality (repeating for 4 weeks) in the booking dialog.
- Implemented Group Tutoring Sessions support via a new session_participants schema.
- Implemented No-Show Penalties tracking and automatic suspension triggers.
- Checked off all Learner Experience features in the unimplemented QoL features tracker.
- Implemented Tutor Experience features: Bulk Availability Editing, Auto-Approve Sessions, Timesheet Auto-Clock Out Protection, Calendar Syncing toggles, and Meeting Link / Rescheduling functionalities.
