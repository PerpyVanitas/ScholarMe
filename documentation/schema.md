# ScholarMe — Database Schema Reference

> This document is the **authoritative database schema reference** for ScholarMe.  
> It tracks the expected state of the Postgres database (hosted via Supabase), including relationships, indexes, and Row Level Security (RLS) policies.  
> Last updated: 2026-07-13

---

## 👥 Users & Profiles

The core identity layer. Supabase Auth (`auth.users`) handles authentication, while our public `profiles` table stores application-specific identity data.

### `roles`

Defines the base roles available in the system.

- **`id`** (`uuid`, Primary Key)
- **`name`** (`text`, Unique) — e.g., 'tutor', 'learner', 'super_admin', 'administrator'.

### `profiles`

The primary user table, linking `auth.users` to their identity and capabilities.

- **`id`** (`uuid`, Primary Key) — References `auth.users(id)` ON DELETE CASCADE.
- **`role_id`** (`uuid`, Foreign Key to `roles(id)`) — The user's system role (highest privilege).
- **`org_assignment_id`** (`uuid`, nullable, Foreign Key to `org_assignments(id)`) — Link to their current org position.
- **`full_name`** (`text`)
- **`email`** (`text`)
- **`avatar_url`** (`text`, nullable)
- **`phone_number`** (`text`, nullable)
- **`date_of_birth`** (`date`, nullable)
- **`total_xp`** (`integer`, default 0) — Total gamification experience points.
- **`current_level`** (`integer`, default 1) — Calculated level based on total_xp.
- **`no_show_count`** (`integer`, default 0) — Used for suspension thresholds.
- **`booking_suspended_until`** (`timestamptz`, nullable) — Hard lock on booking capabilities.
- **`membership_classification`** (`text`, default 'learner') — `regular_member`, `esas_scholar`.
- **`role_expires_at`** (`timestamptz`, nullable) — When their org role reverts to tutor (usually June 30).
- **`committee`** (`text`, nullable) — Which committee they belong to.
- **`service_hours_balance`** (`numeric`, default 0) — For ESAS tracking.
  _RLS Policy:_ Users can read all public profiles, but can only update their own. `super_admin` can update any.

---

## 🏛️ Organizational Structure (New!)

Manages the Honor Society's yearly terms and executive/committee board assignments.

### `org_terms`

Represents an academic year (e.g., A.Y. 2026-2027).

- **`id`** (`uuid`, Primary Key)
- **`label`** (`text`) — e.g. "A.Y. 2026-2027".
- **`term_start`** (`date`)
- **`term_end`** (`date`)
- **`is_current`** (`boolean`)
- **`created_by`** (`uuid`, FK to profiles)
  _Constraint:_ Unique partial index on `is_current` where it is `true` (only one current term allowed).

### `org_assignments`

Maps a user to a specific position within a term.

- **`id`** (`uuid`, Primary Key)
- **`term_id`** (`uuid`, FK to `org_terms`)
- **`user_id`** (`uuid`, FK to `profiles`)
- **`position`** (`text`) — e.g., 'president', 'committee_head'.
- **`committee`** (`text`, nullable) — The committee if applicable.
  _Constraint:_ Unique constraint on `(term_id, position, committee)` — ensures only one person holds a singleton position per term.

---

## 📅 Sessions & Tutors

Manages the core tutoring capabilities, booking, and attendance.

### `tutor_profiles`

Extended details specifically for Honor Society members who tutor.

- **`id`** (`uuid`, Primary Key, FK to `profiles`)
- **`bio`** (`text`)
- **`subjects`** (`text[]`) — Areas of expertise.
- **`rating`** (`numeric`, default 5.0) — Aggregate peer/student rating.
- **`total_sessions`** (`integer`, default 0)

### `sessions`

Represents a booked tutoring block (1-on-1 or group).

- **`id`** (`uuid`, Primary Key)
- **`tutor_id`** (`uuid`, FK to `profiles`)
- **`student_id`** (`uuid`, FK to `profiles`) — The primary organizer.
- **`subject`** (`text`)
- **`status`** (`text`) — `pending`, `scheduled`, `completed`, `cancelled`, `no_show`.
- **`scheduled_at`** (`timestamptz`)
- **`duration_minutes`** (`integer`)
- **`max_participants`** (`integer`, default 1) — Defines if it's a group session.
- **`is_office_hours`** (`boolean`, default false) — Open group sessions flagged by tutors.

### `session_participants`

Junction table for group sessions (allows up to `max_participants`).

- **`id`** (`uuid`, Primary Key)
- **`session_id`** (`uuid`, FK to `sessions`)
- **`user_id`** (`uuid`, FK to `profiles`)
- **`joined_at`** (`timestamptz`)

### `attendance_logs` (Timesheets)

Tracks tutor presence in the PLC.

- **`id`** (`uuid`, Primary Key)
- **`tutor_id`** (`uuid`, FK to `profiles`)
- **`clock_in`** (`timestamptz`)
- **`clock_out`** (`timestamptz`, nullable)
- **`location_verified`** (`boolean`) — Used for QR scanner/geolocation validation.

---

## 📚 Quizzes, Flashcards & SRS

The AI-powered study tools and spaced repetition system.

### `study_sets`

A collection of items (flashcards/quizzes).

- **`id`** (`uuid`, Primary Key)
- **`owner_id`** (`uuid`, FK to `profiles`)
- **`title`** (`text`)
- **`description`** (`text`)

### `study_items`

Individual questions/flashcards inside a set.

- **`id`** (`uuid`, Primary Key)
- **`study_set_id`** (`uuid`, FK to `study_sets(id)` ON DELETE CASCADE)
- **`question`** (`text`)
- **`answer`** (`text`)
- **`options`** (`jsonb`, nullable) — Distractors for multiple choice.
- **`item_type`** (`text`) — 'flashcard', 'multiple_choice', 'true_false'.
- **`image_url`** (`text`, nullable)
- **`occlusion_masks`** (`jsonb`, nullable) — Coordinates for hidden image boxes.

### `flashcard_attempts` (SRS Data)

Tracks the SM2 spaced repetition algorithm for a specific user and flashcard.

- **`id`** (`uuid`, Primary Key)
- **`user_id`** (`uuid`, FK to `profiles`)
- **`study_set_item_id`** (`uuid`, FK to `study_items(id)` ON DELETE CASCADE)
- **`repetitions`** (`integer`)
- **`ease_factor`** (`numeric`)
- **`interval_days`** (`integer`)
- **`next_review_date`** (`timestamptz`)

---

## 📁 Library & Resources

Digital and Physical asset management.

### `resources` (Digital)

PDFs, docs, and images uploaded by users.

- **`id`** (`uuid`, Primary Key)
- **`title`** (`text`)
- **`file_url`** (`text`) — Path in Supabase Storage.
- **`is_public`** (`boolean`, default false) — Privacy toggle.
- **`uploaded_by`** (`uuid`, FK to `profiles`)

### `physical_resources` (Physical Library)

Inventory of actual books in the center.

- **`id`** (`uuid`, Primary Key)
- **`title`** (`text`)
- **`isbn`** (`text`, Unique)
- **`total_quantity`** (`integer`)
- **`available_quantity`** (`integer`)

### `resource_checkouts`

Tracks who holds a physical book.

- **`id`** (`uuid`, Primary Key)
- **`resource_id`** (`uuid`, FK to `physical_resources`)
- **`user_id`** (`uuid`, FK to `profiles`)
- **`status`** (`text`) — `active`, `returned`, `overdue`.

---

## 💰 Finance & Logistics

Extremely sensitive module for managing org funds.

### `finance_budget_requests`

- **`id`** (`uuid`, Primary Key)
- **`activity_title`** (`text`)
- **`amount`** (`numeric`)
- **`status`** (`text`) — `draft`, `pending`, `approved`, `rejected`, `liquidated`.
  _RLS Policy:_ Locked down. Users can only see their own requests. President, Treasurer, Auditor can see all.

### `finance_liquidations`

- **`id`** (`uuid`, Primary Key)
- **`request_id`** (`uuid`, FK to `finance_budget_requests`)
- **`receipt_urls`** (`text[]`)
- **`returned_amount`** (`numeric`)

### `finance_scards` (Reports)

Aggregated monthly/event financial reports.

- **`id`** (`uuid`, Primary Key)
- **`balance`** (`numeric`)
- **`cosigned_by`** (`uuid[]`, FK to `profiles`) — Array of officer IDs who signed off.

---

## 🎮 Gamification & Achievements

### `xp_events`

Ledger of all XP earned to prevent cheating.

- **`id`** (`uuid`, Primary Key)
- **`user_id`** (`uuid`, FK to `profiles`)
- **`amount`** (`integer`)
- **`reason`** (`text`) — e.g. "Completed Session", "Secret Egg Found".

### `user_achievements`

Badges unlocked by users.

- **`id`** (`uuid`, Primary Key)
- **`user_id`** (`uuid`, FK to `profiles`)
- **`achievement_id`** (`uuid`, FK to `achievements`)

---

## 🛠️ Admin & Telemetry

### `login_history`

- **`id`** (`uuid`, Primary Key)
- **`user_id`** (`uuid`, FK to `profiles`)
- **`ip_address`** (`text`)
- **`login_at`** (`timestamptz`)

### `analytics_logs`

Generic telemetry for dashboards.

- **`event_type`** (`text`) — e.g. 'page_view', 'button_click'.
- **`metadata`** (`jsonb`)

### `integration_configs`

API keys for external services.

- **`id`** (`uuid`, Primary Key)
- **`integration_name`** (`text`)
- **`api_key`** (`text`, encrypted/sensitive)
  _RLS Policy:_ Extremely strict. `super_admin` ONLY.

---

## Database Triggers & Functions

- **`trg_enforce_single_super_admin`**: Before INSERT or UPDATE on `profiles`, checks if `role_id` corresponds to `super_admin`. If true, counts existing super_admins. Throws exception if count >= 1.
- **`calculate_xp_curve`**: Function used to dynamically compute a user's level based on `total_xp`. Formula: `Level = FLOOR(0.1 * SQRT(total_xp)) + 1`.
- **`tutor_analytics_trigger`**: On UPDATE to `sessions` (status = 'completed'), automatically increments `total_sessions`, `hours_tutored` on `tutor_profiles`, and awards 50 XP to the tutor's profile.
