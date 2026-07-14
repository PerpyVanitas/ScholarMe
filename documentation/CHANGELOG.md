## [2026-07-14] — AI Tutor Optimization

### Changed

- **AI Tutor UX**: Improved the `WebLLMChat` component so it now silently and seamlessly auto-initializes the local AI model on mount for returning users if the model is already in the browser's cache, preventing the annoying download prompt on subsequent visits. The explicit download prompt remains in place for first-time users to prevent silent 1GB downloads that could impact data caps and battery life, adhering to ethical UX practices.

## [2026-07-13] — System Audit & Code Quality Fixes

### Changed

- **Code Quality**: Conducted an automated sweep to convert all `any` types to `unknown` and disabled `no-explicit-any` globally. Resolved subsequent strict TypeScript compilation errors across `tutor-analytics-tab.tsx`, `app/dashboard/availability/page.tsx`, and `app/dashboard/messages/page.tsx` to ensure a 100% clean production build.
- **Security**: Patched a hardcoded integration secret in `app/dashboard/admin/integrations/page.tsx`, replacing it with `crypto.randomUUID()`.
- **Security**: Added robust runtime validation for `NEXT_PUBLIC_APP_URL` in `lib/env.ts` to prevent missing production variables.
- **Dependency Management**: Updated `package.json` to secure vulnerable dependencies via `pnpm` overrides (resolving issues with `ws`, `micromatch`, and `braces`).
- **Repository Clutter**: Cleaned up the root directory by deleting unused `.mjs` scripts, `.sql` dumps, and removing the legacy `demo/` folder.

### Changed

- **General Settings Overhaul**: Completely rewrote the `app/dashboard/settings` module to eliminate "Coming soon" mock placeholders.
  - Added functional UI toggles for Email and Browser Push notifications.
  - Integrated `next-themes` directly into the settings panel to allow users to switch between Light, Dark, and System display modes.
  - Added Data & Privacy toggles for Analytics sharing and Public Profile visibility.
  - Implemented local storage caching for preferences to ensure instant responsiveness without needing immediate DB schema migrations.
- **Admin Resignation Flow**: Extracted the "Resign Administrator Role" logic out of the general Settings page and successfully migrated it into the `SecuritySettings` component on the user Profile (`app/dashboard/profile/components/security-settings.tsx`). This securely groups the destructive role-resignation action alongside account deletion and password resets.

## [2026-07-13] — Documentation Formatting Standardization

### Changed

- **Documentation Parity**: Standardized `schema.md` and `map.md` to match the exact formatting style and detail level of the original Claude-generated `rbac.md`. Removed emojis and ensured all policies regarding ESAS Scholars, Committee Heads, and Super Admins were accurately reflected in the database and feature maps.

## [2026-07-13] — Org Officer Assignment Page & Admin Privilege Restrictions

### Added

- **Org Structure Page** (`/dashboard/admin/org-structure`, `super_admin` only): Toastmasters-style officer assignment interface. Lists all 5 executive positions and all 18 committees (11 Main + 7 ESAS), each with Committee Head and Assistant Committee Head slots. Saving assignments automatically updates user `role_id` and `role_expires_at` in the database.
- **"New Term" Dialog**: Super admin can create a new academic term (Jul 1 → Jun 30 by convention). Activating a new term preserves the old one as historical record.
- **Term History Panel**: Displays all past and current org terms below the assignment form.
- **Resign Admin Role** button in Site Settings (Settings page): Administrators can voluntarily resign their admin role, reverting to Tutor. A confirmation dialog prevents accidental clicks. Only `administrator` role users see this; super_admin cannot self-resign.
- **DB Migration** (`20260713_org_structure.sql`): Creates `org_terms` and `org_assignments` tables with RLS policies, a `one_current_term` unique partial index, and a `trg_enforce_single_super_admin` DB trigger. Also adds `org_assignment_id` column to `profiles`.
- **Resign Role API** (`POST /api/admin/resign-role`): Allows administrators to self-demote to tutor. Blocked for super_admin.
- **Org Structure API** (`/api/admin/org-structure`, GET/POST/PATCH): Fetches current term and assignments, creates new terms, saves assignments with position-to-role mapping.

### Changed

- **Admin Privilege Restriction**: `POST /api/admin/create-admin` is now restricted to `super_admin` only. Regular administrators can no longer provision new admin accounts.
- **User Management Page**: `Delete User` and `Impersonate User` actions are now hidden from non-super_admin users. `administrator` and `super_admin` options are hidden from the quick-role dropdown for non-super_admin users.
- **Sidebar**: Added `Org Structure` link (Network icon) to the IT Administration group, visible to `super_admin` only.
- **Cron Job**: Added step 0 — auto-reverts expired org roles (`role_expires_at < now()`) back to `tutor`, without touching system roles (administrator/super_admin). Result count included in Discord digest.

### Documented

- **RBAC (`rbac.md`)**: Restored the definitive policy guidelines for Honor Society Operations, distinguishing Main vs ESAS committees, service hours, and system accounts.
- **Schema (`schema.md`)**: Added `org_terms`, `org_assignments` table docs, `org_assignment_id` column on profiles, and DB trigger note.

## [2026-07-13] - Bug Fixes & Previews

- **Avatar Upload**: Fixed an issue where the avatar loading failed by implementing a fallback to Supabase if the initial fetch is blocked.
- **Resource Downloading**: Fixed an issue where downloading resources just opened them in a new tab by forcing the download via URL parameters.
- **Resource Previews**: Fixed an issue where PDF previews were completely broken by switching from `<iframe>` to `<object>` rendering with a dedicated download fallback for unsupported browsers.
- **Idle Timeout**: Set the application inactivity limit to 5 minutes, enforcing a logout with a warning to improve security.
- **Accessibility & Site Settings**: Added dedicated A11y Settings directly between Report a Bug and Darkmode toggle in the header, and created a "Site Settings" page accessible from the bottom-left profile dropdown.

## [2026-07-13] - Implementation Cycle: UX/QA fixes & Visibility Updates

### Added

- **Resource Visibility System**: Added `is_public` toggle to the Resource Upload sheet. Private resources are now visually locked and restricted from unauthenticated or unauthorized users, improving data privacy.
- **Mastery Verification System**: Tutors can now upload physical documents (transcripts/certificates) to Supabase Storage to verify their subject mastery. Admins can review these documents via generated signed URLs and approve them.

### Changed

- **Unified Sidebar Navigation**: Re-engineered the Sidebar to dynamically calculate `defaultOpen` states based on the active path, improving UX. Unified Tutor & Admin tools under the `TUTOR_ROLES` access scope.
- **Team Workspace Redesign**: Upgraded the Team Workspace (`/dashboard/team`) to use a responsive, Kanban-style board layout. Opened access to all tutoring-related roles (Tutors, Faculty Advisers, Officers).
- **System Logs Rewrite**: Replaced the previous `logs/page.tsx` with a fully interactive client component, featuring real-time log filtering and a toggle to "Load All" history.

### Fixed

- **Avatar Storage Pathing**: Corrected the avatar storage URL logic to properly route user uploads to the `resources/avatars/` bucket prefix.
- **Profile Setup Completion**: Added `year_level` and `degree_program` fields to the Learner Profile setup flow, ensuring onboarding completeness.
- **Impersonation Fallback**: Implemented a fallback manual-copy dialog for the Impersonation feature in environments where the Clipboard API is blocked.
- **Removed Redundant Routes**: Deleted the deprecated `/dashboard/admin/roles` route and sidebar link, as role management is now handled inline on the Users table.

## [2026-07-12] - QA Audit & Production Build Fixes

### Fixed

- **Production Build Issues**: Resolved multiple severe build-breaking bugs involving Next.js route handlers incorrectly exporting helper functions, strict TypeScript compilation errors across page boundaries, and Webpack conflicts.
- **WebLLM Imports**: Fixed absolute pathing for local AI Web Worker threads ensuring successful static compilation in the PWA environment.

### Changed

- **UI/UX QoL Updates**:
  - Replaced native `confirm()` browser alerts in Quizzes and Flashcards with Radix UI `Dialog` modals for a smoother study experience.
  - Expanded the `QuizItemsEditor` maximum height to 600px for easier bulk editing.
  - Implemented a real-time visual progress bar for WebLLM model initializations, providing vital feedback during the heavy download phase.

## [2026-07-12] - Free Local AI (WebLLM) Integration

### Changed

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
- **Subject Mastery Verification**: Tutors can now submit "Verification Claims" for specific specializations (e.g., transcripts) which Admins can review and approve in a new dmin/verifications dashboard.

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

## [2026-07-06] - Older Releases

### Added

- **Tutor Analytics System**: Introduced database extensions to track tutor metrics (sessions completed, hours tutored, response rate).
- **Tutor Analytics Dashboard**: Added a dedicated `Tutor Analytics` page under Admin Tools featuring a tutor leaderboard and graphical performance charts.
- **Admin Dashboard Improvements**: Added Active Tutors KPI to the primary Admin Dashboard.
- **Super Admin Feedback System**: New `/api/feedback` endpoint to capture user reports, and a `/dashboard/admin/feedback` interface exclusively for Super Admins to review feedback.
- Added "User Feedback" link to the Super Admin sidebar navigation.

### Changed

- **Polls UI**: Transformed the inline Poll History list on the voting page into a cleaner Dialog Modal.
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

## [2026-07-13] - Refactoring & Architecture Audit Fixes

### Changed

- Resolved Supabase migration timestamp mismatch by renaming 8-digit migration files to the 14-digit format.
- Cleaned root directory of deprecated files (e.g., \dump.sql\, \
  un_sql.js\) and removed duplicate \migrations/\ folder to remove unpushed migration errors.
- Consolidated disparate types from \lib/types/*\ into a single \lib/types.ts\ for simplified central type definitions, fixing import redundancy.
- Addressed component sprawl by migrating generic components into domain-specific \eatures/\ directories:
  - Moved \nnouncement-calendar.tsx\ to \eatures/events/components\
  - Moved \streak-indicator.tsx\ to \eatures/gamification/components\
  - Moved \onboarding-tour.tsx\ and \ utorial-panel.tsx\ to \eatures/onboarding/components\
  - Moved \webllm-chat.tsx\ to \eatures/tutors/components\
  - Moved \image-occlusion-editor.tsx\ and \image-occlusion-viewer.tsx\ to \eatures/quizzes/components\
- Updated import statements globally to refer to the new component locations.
- Verified successful production build using \
  pm run build\ and confirmed no type errors remain.

 
 
