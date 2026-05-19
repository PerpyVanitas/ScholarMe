# ScholarMe System Audit

Audit date: 2026-05-19

Scope: Next.js app routes and pages, Supabase migrations/RLS, Android client, and Spring Boot backend. The working tree had many pre-existing uncommitted changes during this audit; no source files were modified other than this report.

## Executive Summary

The system is currently not shippable. The web app compiles JavaScript but fails TypeScript validation under Next 16. The Android app fails Kotlin compilation. Several authenticated Android API routes verify a bearer token but then run Supabase queries through a cookie-based anonymous/server client, so RLS will not see the mobile user. The migration story is fragmented across multiple directories and includes invalid PostgreSQL syntax in the main migration file. The Spring Boot backend entity model is also out of sync with the SQL schema.

## Verification Run

- `npm.cmd run build`: failed at TypeScript validation after successful Next compilation.
- `npm.cmd run lint`: failed because `eslint` is referenced by `package.json` but is not installed.
- `./gradlew.bat :app:compileDebugKotlin`: failed with unresolved Kotlin/Compose references.
- `backend/mvnw.cmd test`: failed before Maven start because the checked-in Windows wrapper script cannot handle a null `.Target` value.

## Remediation Update

Update date: 2026-05-19

Completed corrections:
- Restored the Next.js production build by fixing the Android resource route handler signature, the messaging realtime payload typing issue, the stale tutor modal import, and the missing `web-push` declaration.
- Restored Android Kotlin compilation by fixing missing Compose/icon imports and the Material 3 opt-in in the availability screen.
- Hardened public registration so client-submitted roles cannot create administrator accounts; public signup now only accepts tutor explicitly and otherwise falls back to learner.
- Hardened several role checks and client role parsing so Supabase `roles` may be returned either as an object or an array.
- Updated tutor timesheet/profile lookups to use the active `tutors.user_id` schema.
- Set the landing page to dark mode by default and restored the desktop theme toggle beside the sign-in/dashboard link.
- Corrected Android messaging Retrofit paths to the implemented `/api/android/messages` routes and changed Android card issuing to `POST /api/android/admin/cards`.
- Restored the lint command by adding ESLint dependencies and a Next-compatible flat config. Lint now exits successfully, with the current legacy baseline reported as warnings.

Latest verification:
- `npm.cmd run build`: passed.
- `npm.cmd run lint`: passed with warnings.
- `./gradlew.bat :app:compileDebugKotlin`: passed with Kotlin warnings.

Remaining major audit items:
- Android bearer-token API routes still need a shared bearer-bound Supabase client/helper.
- Migration sources still need consolidation and invalid `CREATE POLICY IF NOT EXISTS` cleanup.
- Android feature parity gaps remain for resource upload, study-set creation, poll creation/results, timesheet persistence, admin user routes, and availability save endpoints.
- Spring Boot schema/entity drift and the Maven wrapper issue remain unresolved.

## Critical Findings

### 1. Web build fails on a Next 16 route handler signature

File: `app/api/android/resources/repositories/[id]/files/route.ts`

The route declares `GET(request, { params }: { params: { id: string } })`, but Next 16 validates route context as `{ params: Promise<{ id: string }> }`. Production build fails in `.next/types/validator.ts`.

Evidence:
- `app/api/android/resources/repositories/[id]/files/route.ts:9-12`
- Build error: `Type '{ params: { id: string; }; }' is not assignable to type '{ params: Promise<{ id: string; }>; }'`

Impact: The web application cannot produce a production build.

Recommended fix: update this route to accept `context: { params: Promise<{ id: string }> }` and `const { id } = await context.params`.

### 2. Android bearer-token routes verify auth but query Supabase as the wrong principal

Files:
- `app/api/android/auth/profile/route.ts`
- `app/api/android/auth/update-profile/route.ts`
- `app/api/android/resources/repositories/route.ts`
- `app/api/android/resources/repositories/[id]/files/route.ts`

Pattern:
1. Read `Authorization: Bearer ...`.
2. Call `supabase.auth.getUser(token)`.
3. Run `.from(...)` queries using `createClient()` from `lib/supabase/create-client.ts`.

`createClient()` is cookie-backed (`cookies().getAll()`), not request-header-backed. Verifying the JWT does not make later database queries run as that user. Under RLS, these queries run with the request cookies, or anonymously for mobile API calls.

Evidence:
- `lib/supabase/create-client.ts:4-24`
- `app/api/android/auth/profile/route.ts:15-35`
- `app/api/android/auth/update-profile/route.ts:15-57`
- `app/api/android/resources/repositories/route.ts:11-44`
- `app/api/android/resources/repositories/[id]/files/route.ts:14-29`
- Android sends bearer tokens through `android/app/src/main/java/com/scholarme/core/data/remote/AuthInterceptor.kt:27-33`

Impact: Mobile profile, resources, notifications, sessions, and similar routes can fail with RLS errors or return incomplete/public-only data despite a valid token.

Recommended fix: centralize an Android API Supabase factory that creates a request-scoped client with the bearer token in the global `Authorization` header, or use a service-role client only after explicit server-side authorization checks.

### 3. Android registration creates auth users, then often fails profile creation

File: `app/api/android/auth/register/route.ts`

The route signs up a Supabase auth user without passing `role_id` or `full_name` metadata, then inserts into `profiles` manually. The migration trigger `handle_new_user()` already inserts a `profiles` row on auth user creation with `ON CONFLICT DO NOTHING`.

Evidence:
- Signup metadata only includes first/last name: `app/api/android/auth/register/route.ts:40-49`
- Manual profile insert: `app/api/android/auth/register/route.ts:90-100`
- Trigger creates profile on auth user insert: `scripts/migrations/01_roles_and_profiles.sql:76-107`

Impact: The manual insert can hit duplicate primary key errors, returning `500` after the auth user was already created. That leaves orphaned or incorrectly initialized accounts. Tutor registration also does not create the `tutors` row.

Recommended fix: pass all needed metadata into `signUp` and let the trigger own profile creation, or replace the manual insert with an idempotent `upsert` and rollback/delete the auth user on failure. Add tutor-row creation for tutor accounts.

### 4. Admin role checks are likely false for valid administrators

Files:
- `app/api/admin/users/route.ts`
- `app/api/admin/cards/route.ts`
- `app/api/admin/create-admin/route.ts`

These endpoints select `roles(name)` and then require `Array.isArray(profile?.roles)`. A `profiles.role_id -> roles.id` relationship is many-to-one, so Supabase commonly returns a single object, not an array. Other routes already account for both object and array forms.

Evidence:
- `app/api/admin/users/route.ts:20-29`
- `app/api/admin/cards/route.ts:12-22`
- `app/api/admin/create-admin/route.ts:19-28`
- Contrasting robust handling: `app/api/android/auth/profile/route.ts:44-46`

Impact: Admin APIs can reject real administrators with `403`, breaking user management, card issuing, and admin creation.

Recommended fix: normalize role extraction in a shared helper, for example accepting both `{ name }` and `[{ name }]`.

### 5. Main migration file contains invalid PostgreSQL policy syntax

Files:
- `scripts/supabase_migration.sql`
- `MIGRATION_CLEAN.sql`

The main migration uses `CREATE POLICY IF NOT EXISTS`, which PostgreSQL does not support. The migration runner reads `scripts/supabase_migration.sql`, so this is on the active migration path.

Evidence:
- Runner target: `scripts/run-migrations.js:20-22`
- Invalid examples: `scripts/supabase_migration.sql:45-54`, `scripts/supabase_migration.sql:506-512`
- Same pattern repeats throughout `MIGRATION_CLEAN.sql`.

Impact: Fresh database setup will fail partway through, leaving a partially migrated schema.

Recommended fix: use `DROP POLICY IF EXISTS ...; CREATE POLICY ...;` consistently, or wrap policy creation in a `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN NULL; END $$;` block.

### 6. Supabase migration sets conflict and schema drift are substantial

There are at least four migration sources:
- `scripts/migrations/*.sql`
- loose `scripts/00*.sql` files
- `scripts/supabase_migration.sql`
- `supabase/migrations/*.sql`
- plus `MIGRATION_CLEAN.sql`

The schema differs between them. One example: `supabase/migrations/001_rls_policies.sql` checks `tutors.profile_id`, while the active tutor table uses `user_id`.

Evidence:
- Bad policy reference: `supabase/migrations/001_rls_policies.sql:45-49`
- Active tutor schema: `scripts/migrations/03_tutors_and_specializations.sql:8-18`

Impact: Developers can apply different incompatible schemas depending on which migration path they follow. RLS can fail at creation time or silently authorize against nonexistent/wrong columns.

Recommended fix: choose one canonical migration path and delete/archive the rest, or make noncanonical files clearly historical. Add a database bootstrap check in CI.

## High Findings

### 7. Android app does not compile

`./gradlew.bat :app:compileDebugKotlin` fails with unresolved references.

Examples:
- Missing `Alignment` import: `android/app/src/main/java/com/scholarme/features/admin/ui/UserManagementScreen.kt:65`, `:70`, `:77`
- Missing `clickable` import: `android/app/src/main/java/com/scholarme/features/admin/ui/UserManagementScreen.kt:126`, `:169`
- Missing `Security` icon import: `android/app/src/main/java/com/scholarme/features/admin/ui/UserManagementScreen.kt:153`
- Missing `Modifier` and `Alignment` imports: `android/app/src/main/java/com/scholarme/features/resources/ui/ResourceDirectoryScreen.kt:76`, `:94`, `:143`
- Missing `ArrowBack` icon import: `android/app/src/main/java/com/scholarme/features/admin/ui/AdminDashboardScreen.kt:37`, `android/app/src/main/java/com/scholarme/features/availability/ui/AvailabilityManagerScreen.kt:32`

Impact: Android builds cannot be produced.

Recommended fix: add the missing Compose imports, verify icon names exist in the Material icon artifact, and keep `compileDebugKotlin` in CI.

### 8. Spring Boot entity mappings do not match the SQL schema

The Spring app uses `spring.jpa.hibernate.ddl-auto=validate`, so schema mismatch prevents startup against the Supabase schema.

Examples:
- `Tutor` maps the primary key as a shared `id` join to `profiles`, but SQL uses `tutors.id` plus `tutors.user_id`.
- `User` maps `phone`, `degree_program`, `year_level`, `device_token`, and `device_type`, while the shown profile migration uses `phone_number`, `birthdate`, `membership_number`, etc.
- `Session.tutor_id` is nullable in SQL via `ON DELETE SET NULL`, but Java marks it `nullable = false`.

Evidence:
- `backend/src/main/java/com/scholarme/shared/entity/Tutor.java:20-26`
- `scripts/migrations/03_tutors_and_specializations.sql:8-18`
- `backend/src/main/java/com/scholarme/shared/entity/User.java:35-48`
- `scripts/migrations/01_roles_and_profiles.sql:9-28`
- `backend/src/main/java/com/scholarme/features/sessions/Session.java:23-29`
- `scripts/migrations/04_sessions.sql:1-14`

Impact: The Spring backend is tightly coupled to an older or different schema and likely fails validation/startup.

Recommended fix: decide whether Next API routes or Spring Boot is the authoritative backend. If Spring remains, generate migrations from its actual JPA model or update entities to match the canonical SQL.

### 9. The Maven wrapper script is broken on this Windows environment

`backend/mvnw.cmd test` fails before Maven starts:

`Cannot index into a null array.`

Evidence:
- `backend/mvnw.cmd:91-95`

The script indexes `(Get-Item $MAVEN_M2_PATH).Target[0]`, but `.Target` can be null.

Impact: Backend tests/builds are not reproducible on Windows.

Recommended fix: regenerate the Maven wrapper from a known-good Maven version or patch the script to check `$item.Target -and $item.Target.Count`.

### 10. Lint script is declared but tooling is missing

`package.json` declares `"lint": "eslint ."`, but `eslint` is absent from dependencies and devDependencies.

Evidence:
- `package.json:5-10`
- `package.json:70-80`

Impact: Static analysis cannot run, and CI using `npm run lint` fails immediately.

Recommended fix: add `eslint` and the Next/TypeScript config packages, or remove/fix the script.

## Coupling And Design Risks

### 11. Backend ownership is unclear

The repository contains:
- Next.js API routes under `app/api`
- Android Retrofit clients pointed at `https://scholarme.vercel.app/api/android/`
- A Spring Boot backend under `backend`
- Supabase direct-access web components

This creates four sources of backend truth: Supabase RLS, Next route authorization, Android DTO contracts, and Spring entities. The schema drift above is a symptom of that coupling.

Recommended direction: choose one API boundary for mobile and web writes. A pragmatic path is to make Next API routes the current backend, treat Spring as experimental until its schema is reconciled, and put all Supabase access behind shared route helpers.

### 12. Auth and role logic is duplicated

Admin checks and bearer parsing are reimplemented per route. Some accept object roles, some only arrays, and many mobile routes verify tokens without binding the token to the database client.

Recommended direction: add shared helpers:
- `requireWebUser()`
- `requireAdmin()`
- `requireAndroidBearerUser()`
- `createSupabaseForBearer(token)`
- `getRoleName(profile)`

### 13. Migration parser is fragile

Both `scripts/run-migrations.js` and the API migration endpoint split SQL manually by lines and `$$` counts.

Evidence:
- `scripts/run-migrations.js:24-70`
- `app/api/admin/migrations/execute/route.ts:123-167`

Impact: SQL containing dollar-quoted tags, semicolons in strings, multiline comments, or non-function dollar blocks can be split incorrectly.

Recommended direction: stop executing migrations through a custom parser. Use Supabase CLI or a proper migration tool, and remove the runtime migration endpoint.

## Erroneous Or Incomplete Features

### Resource upload on Android is advertised in the API client but not implemented server-side

Android declares `POST resources/upload`.

Evidence:
- `android/app/src/main/java/com/scholarme/features/resources/data/remote/ResourceApi.kt:20-27`

No matching `app/api/android/resources/upload/route.ts` exists in the file inventory. The UI currently shows a placeholder toast instead of upload.

Impact: The feature contract exists in the client but cannot work end to end.

### User role naming is inconsistent

The database role is `administrator`, while Android user management offers `"admin"`.

Evidence:
- Seeded roles: `scripts/migrations/01_roles_and_profiles.sql:6`
- Android role dialog: `android/app/src/main/java/com/scholarme/features/admin/ui/UserManagementScreen.kt:167`

Impact: Role changes from Android can send an invalid role name unless repository mapping translates it.

Recommended fix: use a shared role enum/constant set across web, Android, and SQL: `administrator`, `tutor`, `learner`.

## Requested Role And Feature Limitation Checks

### 1. Only admin users can create polls

Status: partially implemented, but likely broken for real admins.

The database policy intends to restrict poll insertion to administrators:

- `scripts/migrations/05_polls_and_voting.sql:38-44`

The web API also tries to check admin role before creating a poll:

- `app/api/polls/route.ts:49-76`

Problem: the route uses the same fragile `Array.isArray(profile?.roles)` role check described earlier. If Supabase returns `roles` as a single object for the many-to-one role relation, the API rejects a valid admin. If it returns an array in this query shape, it works. The SQL policy is also duplicated in the invalid `scripts/supabase_migration.sql` path with `CREATE POLICY IF NOT EXISTS`, so fresh installs using that file may fail before the policy exists.

Verdict: intended, not reliably implemented.

### 2. Only admin and tutor users can upload resources; admin can delete other users' study sets

Status: not enforced end to end.

The web resources page hides creation/upload controls unless the local role is tutor or administrator:

- `app/dashboard/resources/page.tsx:153`
- `app/dashboard/resources/page.tsx:457`

But the API route for creating repositories accepts any authenticated user and does not check role:

- `app/api/repositories/route.ts:20-49`

The API route for adding resources also accepts any authenticated user and does not check role:

- `app/api/repositories/[id]/resources/route.ts:6-42`

The stronger resource SQL file allows owners to manage repositories/resources and admins to manage all, but it does not limit repository/resource owners to tutors/admins:

- `scripts/005_repositories.sql:51-63`
- `scripts/005_repositories.sql:90-107`

The newer canonical-looking migration is weaker and only defines repository owner writes plus resource read access; it does not define resource insert/update/delete policies:

- `scripts/migrations/10_repositories_and_resources.sql:25-41`

Admin deletion of other users' study sets is not implemented in the study-set API. The delete path forces `user_id = user.id`:

- `app/api/quizzes/[id]/route.ts:51-55`
- `features/quizzes/actions.ts:127-131`

The study-set SQL only allows users to delete their own sets:

- `scripts/001_create_study_sets_schema.sql:70-71`

Verdict: UI-only gating exists for resources, but API/RLS do not reliably enforce it. Admin deletion of other users' study sets is missing.

### 3. All users can create private or public study sets; admin can delete other users' study sets

Status: partially implemented for regular users, not implemented for admin deletion, and schema is inconsistent.

The web create-study-set paths allow any authenticated user to create a study set and set public/private via `is_public`:

- `app/api/quizzes/create/route.ts:20-30`
- `features/quizzes/actions.ts:11-38`
- `app/dashboard/quizzes/page.tsx:349-353`

The public/private read behavior is implemented in the application code:

- `app/api/quizzes/[id]/route.ts:27-30`
- `features/quizzes/actions.ts:111-114`

However, migration/schema definitions disagree. The loose study-set migration uses `owner_id` plus `visibility = 'private' | 'shared'`:

- `scripts/001_create_study_sets_schema.sql:2-17`
- `scripts/001_create_study_sets_schema.sql:61-71`

The current web app uses `user_id` plus `is_public`:

- `app/api/quizzes/create/route.ts:24-28`
- `features/quizzes/actions.ts:29-34`

The Android quizzes route uses `owner_id` plus `is_public`, which is a third shape:

- `app/api/android/quizzes/route.ts:20-37`

No admin delete path exists, and the known delete routes only delete owner-owned rows.

Verdict: the product behavior is present in parts of the web app, but the database migrations and Android API do not agree on column names. Admin delete of other users' study sets is missing.

### 4. Time logging only works for tutors, manual clock in/out, semester totals, heatmap, admin records

Status: only manual clock in/out and a basic admin list are present; most requirements are missing or broken.

Implemented:
- Tutor page has manual clock in/out buttons.
- The API supports `clock_in` and `clock_out` actions.
- Admin page lists all timesheet entries and aggregates totals across all loaded records.

Evidence:
- `app/dashboard/timesheet/page.tsx:79-94`
- `app/api/timesheets/route.ts:19-84`
- `app/dashboard/admin/timesheets/page.tsx:54-96`
- `app/api/admin/timesheets/route.ts:20-26`

Broken or missing:
- Tutor check uses `.eq("profile_id", user.id)`, but the active tutor schema uses `user_id`, not `profile_id`. With the current migration shape, real tutors cannot clock in.
  - `app/api/timesheets/route.ts:26-33`
  - `scripts/migrations/03_tutors_and_specializations.sql:8-18`
- There is no timesheets table creation migration found in the canonical migration folders. Only RLS policies appear under `supabase/migrations/001_rls_policies.sql:85-104`.
- There is no semester table, semester date-range model, or admin UI/API for setting semester dates.
- Totals are not filtered per semester. Tutor total is a lifetime total over completed entries returned by `/api/timesheets`.
  - `app/dashboard/timesheet/page.tsx:96-99`
- No calendar heatmap exists on the tutor timesheet page. It renders summary cards and a table only.
  - `app/dashboard/timesheet/page.tsx:139-241`
- Admin can view all records only if the admin role check succeeds. This route assumes object-shaped `roles`, while other routes assume arrays, so it is also shape-fragile.
  - `app/api/admin/timesheets/route.ts:9-18`

Verdict: manual clock in/out exists, but tutor-only enforcement is currently broken against the active schema. Semester separation, admin semester dates, and calendar heatmap are not implemented.

### 5. Users are not consistently labelled according to registered status

Status: not reliable; there are multiple ways for role labels to become wrong.

High-risk issue: registration trusts client-provided role values.

The web sign-up UI only exposes `learner` and `tutor`:

- `app/auth/sign-up/page.tsx:84`
- `app/auth/sign-up/page.tsx:142`

But the server action accepts `role` from the submitted form and looks it up directly. A tampered form could submit `administrator`; if the roles table is readable and returns the administrator role id, the server creates that account with administrator metadata/profile role:

- `app/auth/actions.ts:26`
- `app/auth/actions.ts:41-59`
- `app/auth/actions.ts:63-77`

The Android registration route is worse: it accepts `accountType` or `role` directly from JSON and uses a service-role client to resolve and insert that role into the profile. A caller can request `administrator` unless the route is changed:

- `app/api/android/auth/register/route.ts:13-15`
- `app/api/android/auth/register/route.ts:74-100`

Additional role-label risks:
- `lib/user-context.tsx` defaults to `learner` unless `roles` is an array. If Supabase returns a single object, an admin/tutor can be displayed as learner.
  - `lib/user-context.tsx:39-45`
- Several admin APIs only accept array-shaped roles, while `app/api/admin/timesheets/route.ts` only accepts object-shaped roles. Different pages can classify the same user differently.
  - `app/api/admin/users/route.ts:20-29`
  - `app/api/admin/timesheets/route.ts:10-17`
- Setup-profile tutor handling still uses `profile_id`, while the active tutor schema uses `user_id`. This can fail to create or find tutor rows, causing tutor accounts to behave like non-tutors in tutor-only features.
  - `app/auth/setup-profile/actions.ts:48-63`
  - `scripts/migrations/03_tutors_and_specializations.sql:8-18`

Verdict: role assignment and role display are not trustworthy. This directly explains accounts appearing as admin/student incorrectly.

Recommended fixes:
- Never accept `administrator` from public registration. Public registration should whitelist only `learner` and, if allowed, `tutor`; admin creation must go through an authenticated admin-only endpoint.
- Resolve role names through one shared server helper and validate against `administrator | tutor | learner`.
- Use the existing `lib/utils/roles.ts` normalization everywhere instead of per-route role parsing.
- Standardize tutor foreign key usage on `tutors.user_id` or migrate all code and SQL to `profile_id`, but do not keep both.
- Add database constraints or triggers that prevent public signup metadata from assigning administrator roles.

## Recommended Remediation Order

1. Fix the Next 16 route-handler signature and restore `npm.cmd run build`.
2. Fix Android compile errors and restore `:app:compileDebugKotlin`.
3. Replace mobile Supabase route auth with a bearer-bound Supabase client helper.
4. Fix Android registration to be idempotent and trigger-compatible.
5. Consolidate admin role checking into one helper and update admin routes.
6. Select one canonical migration path and remove invalid `CREATE POLICY IF NOT EXISTS`.
7. Decide whether Spring Boot remains in scope; if yes, align JPA entities to the canonical SQL schema.
8. Add lint dependencies or remove the lint script.
9. Add CI checks for web build, lint, Android compile, and database migration bootstrap.

## Landing Page Improvement Task

Status: requested remediation.

The landing page should be refreshed and made dark mode by default, with a visible light/dark toggle in the navbar beside the login/sign-in button.

Current observations:
- The landing page imports and renders `ThemeToggle`, but the desktop toggle is grouped with the nav links while the sign-in/dashboard link is rendered separately.
  - `app/page.tsx:85-98`
- The mobile menu still includes an appearance toggle.
  - `app/page.tsx:101-115`
- The landing root uses light classes first and dark variants second, so if the app theme provider is not defaulting to dark, the page appears light by default.
  - `app/page.tsx:63-68`
- The theme provider is configured globally, so default theme behavior should be verified in `app/layout.tsx` and `components/theme-provider.tsx`.

Acceptance criteria:
- Landing page opens in dark mode by default for first-time visitors.
- Navbar shows the theme toggle directly beside the login/sign-in or dashboard button on desktop.
- Mobile menu still exposes the same theme toggle.
- Light mode remains available and persists after toggling.
- Landing page design is reviewed for current product quality, not only theme behavior.
- Verify both desktop and mobile layouts after the nav changes.

## Web Vs Android Feature Parity

The web app has a broader feature surface than Android. Android contains route/screen shells for many areas, but several are either not reachable from primary navigation, use hardcoded/mock data, point to missing `/api/android` endpoints, or omit web workflows entirely.

### Web features missing or incomplete on Android

| Feature | Web status | Android status | Evidence |
| --- | --- | --- | --- |
| Create study sets/quizzes | Implemented with create dialog, manual Q/A parser, public/private switch, and delete action. | Not implemented. Android `QuizApi` only has `GET` endpoints; `QuizListScreen` displays a hardcoded `"Midterm Practice"` card. | `app/dashboard/quizzes/page.tsx:73-132`, `app/dashboard/quizzes/page.tsx:134-140`, `android/app/src/main/java/com/scholarme/features/quizzes/data/remote/QuizApi.kt:8-17`, `android/app/src/main/java/com/scholarme/features/quizzes/ui/QuizListScreen.kt:40-49` |
| My/shared study-set tabs | Web loads `/api/quizzes/my-sets` and `/api/quizzes/shared`. | Android route accepts `tab`, but app UI does not expose tabs and route code uses `owner_id` while web uses `user_id`. | `app/dashboard/quizzes/page.tsx:29-64`, `app/api/android/quizzes/route.ts:17-37` |
| Resource repository creation | Web tutors/admins can create repositories. | Android only lists repositories. No create endpoint in `ResourceApi` and no create UI. | `app/dashboard/resources/page.tsx:203-228`, `android/app/src/main/java/com/scholarme/features/resources/data/remote/ResourceApi.kt:8-27` |
| Resource upload | Web has title, description, repository selector, file picker, file validation guidance, and upload flow. | Android file picker ends in a toast: `"Upload functionality coming soon"`. `ResourceApi` points to `POST resources/upload`, but there is no matching `app/api/android/resources/upload/route.ts` in the file tree. | `app/dashboard/resources/page.tsx:390-471`, `android/app/src/main/java/com/scholarme/features/resources/ui/ResourceDirectoryScreen.kt:40-48`, `android/app/src/main/java/com/scholarme/features/resources/data/remote/ResourceApi.kt:20-27` |
| Resource search/filter | Web has repository search and file-type filter. | Android search field is stateless (`value = ""`), so typed text cannot persist; no file-type filter. | `app/dashboard/resources/page.tsx:479-496`, `android/app/src/main/java/com/scholarme/features/resources/ui/ResourceDirectoryScreen.kt:81-84` |
| Resource viewer contents | Web expands repositories and lists files. | Android viewer is navigated with `repoName = "Repository #$repoId"` and does not receive loaded file data at navigation time. | `app/dashboard/resources/page.tsx:514-540`, `android/app/src/main/java/com/scholarme/core/navigation/AppNavHost.kt:209-217` |
| Poll creation by admins | Web has admin-only create-poll dialog. | Android voting supports list/vote only; no create poll UI/API method. | `app/dashboard/voting/page.tsx:127-139`, `android/app/src/main/java/com/scholarme/features/voting/data/remote/VotingApi.kt:9-15` |
| Poll results view | Web loads `/api/polls/{id}/results`, shows vote counts/percentages, and displays results after voting. | Android voting screen appears list/vote oriented; no results endpoint in `VotingApi`. | `app/dashboard/voting/page.tsx:69-83`, `app/dashboard/voting/page.tsx:223-248`, `android/app/src/main/java/com/scholarme/features/voting/data/remote/VotingApi.kt:9-15` |
| Tutor availability editing | Web allows tutor availability changes against Supabase. | Android has a schedule display and availability toggle, but Save is TODO and day checkboxes are read-only. `AvailabilityApi` points to `/api/android/availability`, but no such route exists in `app/api/android`. | `app/dashboard/availability/page.tsx:62-100`, `android/app/src/main/java/com/scholarme/features/availability/ui/AvailabilityManagerScreen.kt:35-39`, `android/app/src/main/java/com/scholarme/features/availability/ui/AvailabilityManagerScreen.kt:121`, `android/app/src/main/java/com/scholarme/features/availability/data/remote/AvailabilityApi.kt:8-20` |
| Tutor timesheet clock in/out | Web calls `/api/timesheets` for real clock in/out and history. | Android `TimesheetRepository` is in-memory only and `TimesheetScreen` renders hardcoded `42.5` hours plus five fake entries. | `app/api/timesheets/route.ts:19-84`, `app/dashboard/timesheet/page.tsx:79-99`, `android/app/src/main/java/com/scholarme/features/timesheet/data/TimesheetRepository.kt:18-76`, `android/app/src/main/java/com/scholarme/features/timesheet/ui/TimesheetScreen.kt:37-59` |
| Admin all-sessions page | Web has `/dashboard/admin/sessions` with status filter and all-session table. | No Android `AdminSessions` screen or route exists. Admin dashboard does not link to all sessions. | `components/app-sidebar.tsx:78-85`, `app/dashboard/admin/sessions/page.tsx:21-138`, `android/app/src/main/java/com/scholarme/core/navigation/Screen.kt:35-45`, `android/app/src/main/java/com/scholarme/features/admin/ui/AdminDashboardScreen.kt:66-104` |
| Admin create-admin account flow | Web admin analytics page includes create-admin dialog and `/api/admin/create-admin`. | No Android UI/API method for creating admin accounts. | `app/dashboard/admin/analytics/page.tsx:51-55`, `app/dashboard/admin/analytics/page.tsx:127-140`, `app/api/admin/create-admin/route.ts:6-124`, `android/app/src/main/java/com/scholarme/features/admin/data/remote/AdminApi.kt:10-53` |
| Admin user creation/deletion | Web admin users page can create, edit, and delete users. | Android admin API exposes list and role update only. No create/delete user method in `AdminApi`. | `app/api/admin/users/route.ts:33-73`, `app/api/admin/users/route.ts:130-170`, `android/app/src/main/java/com/scholarme/features/admin/data/remote/AdminApi.kt:36-53` |
| Admin auth-card issue/revoke | Web uses `/api/admin/cards` with POST/PUT. Android has UI, but Retrofit paths do not match implemented Android API routes: client calls `admin/cards/issue` and `admin/cards/{id}/revoke`; server only implements `GET/POST /api/android/admin/cards`. | Endpoint mismatch makes Android issue/revoke fail. | `app/api/admin/cards/route.ts:7-85`, `app/api/android/admin/cards/route.ts:5-67`, `android/app/src/main/java/com/scholarme/features/admin/data/remote/AdminApi.kt:28-47` |
| Admin timesheet model | Web admin timesheets lists raw clock-in/out entries and aggregates them. | Android admin timesheets expects approval records with `total_hours`, `amount`, `period_start`, `period_end`, and approve/reject. This does not match the web timesheet schema/use. | `app/dashboard/admin/timesheets/page.tsx:54-96`, `app/api/admin/timesheets/route.ts:20-26`, `app/api/android/admin/timesheets/route.ts:13-29`, `android/app/src/main/java/com/scholarme/features/admin/ui/AdminTimesheetScreen.kt:20-25` |
| Messaging API contract | Web messages page uses web components/API. Android Retrofit points at `messaging/conversations`, but implemented Android routes are `app/api/android/messages` and `app/api/android/messages/[id]`. | Android messaging calls the wrong path unless another backend exists. | `android/app/src/main/java/com/scholarme/features/messaging/data/remote/MessagingApi.kt:8-19`, `app/api/android/messages/route.ts:15-132`, `app/api/android/messages/[id]/route.ts:9-123` |
| Account deletion | Web profile supports deleting the current account. | Android profile API has profile update, password change, avatar upload/delete, but no account delete method. | `app/dashboard/profile/page.tsx:55-56`, `app/api/account/route.ts:1-34`, `android/app/src/main/java/com/scholarme/features/profile/data/remote/ProfileApi.kt:8-35` |
| Tutor profile settings | Web profile has tutor-specific bio, hourly rate, years experience, and specializations. | Android update screen passes bio/degree/year/rate/experience, but there is no specialization picker/save flow visible in the Android profile API/screen. Also web currently queries `profile_id`, conflicting with active `user_id` schema. | `app/dashboard/profile/page.tsx:58-68`, `app/dashboard/profile/page.tsx:95-129`, `android/app/src/main/java/com/scholarme/core/navigation/AppNavHost.kt:114-129`, `android/app/src/main/java/com/scholarme/features/profile/data/remote/ProfileApi.kt:12-15` |

### Android routes exist but are not reachable from primary navigation

The Android bottom navigation only exposes Home, Tutors, Schedule, Messages, and Profile:

- `android/app/src/main/java/com/scholarme/MainActivity.kt:42-49`

Other Android screens are reachable only if dashboard buttons expose them correctly for the current role. The web sidebar exposes role-specific pages directly:

- `components/app-sidebar.tsx:55-93`

This creates parity and discoverability gaps for Resources, Quizzes, Voting, Notifications, Leaderboard, Timesheet, Availability, and Admin tools.

### Android endpoint contract drift

Several Android Retrofit methods do not line up with implemented `/api/android` routes:

- `AdminApi.getUsers()` calls `GET /api/android/admin/users`, but no `app/api/android/admin/users/route.ts` exists.
- `AdminApi.updateUserRole()` calls `PATCH /api/android/admin/users/{id}/role`, but no matching route exists.
- `AdminApi.issueCard()` calls `POST /api/android/admin/cards/issue`, but server implements `POST /api/android/admin/cards`.
- `AdminApi.revokeCard()` calls `POST /api/android/admin/cards/{id}/revoke`, but no matching route exists.
- `MessagingApi` calls `messaging/conversations/...`, but server implements `messages` routes.
- `AvailabilityApi` calls `availability` routes, but no `app/api/android/availability` routes exist.
- `ResourceApi.uploadResource()` calls `resources/upload`, but no Android upload route exists.

Recommended parity work:

1. Define a single API contract table for web route, Android route, method, request DTO, response DTO, and auth requirement.
2. Build missing Android routes or change Retrofit paths to existing routes.
3. Replace Android mock/in-memory implementations with network-backed repositories for quizzes, timesheets, resources, and admin tools.
4. Add parity tests that instantiate Retrofit route strings against the Next route tree.
5. Add a product parity checklist per feature before marking Android complete.
