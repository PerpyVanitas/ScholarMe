# ScholarMe — Database Schema Reference

> This document is the **authoritative database schema reference** for ScholarMe.  
> When performing migrations, tracking foreign keys, or debugging data loss, **this file wins**.  
> Last updated: 2026-07-13

---

## Schema Architecture Overview

ScholarMe uses a **relational Postgres database** (hosted via Supabase), leveraging heavily on Row Level Security (RLS) to enforce the rules established in the [RBAC Reference](./rbac.md).

### Core Data Layers

The database is divided into distinct domains:

| Layer                  | Primary Tables                         | Description                                                         |
| ---------------------- | -------------------------------------- | ------------------------------------------------------------------- |
| **1. Identity & RBAC** | `profiles`, `roles`, `org_assignments` | Maps users to their Honor Society roles and permissions.            |
| **2. Operations**      | `sessions`, `attendance_logs`          | The core Peer Learning Center (PLC) tutoring and scheduling engine. |
| **3. Learning**        | `study_sets`, `flashcard_attempts`     | The AI-powered content and Spaced Repetition System (SRS).          |
| **4. Library**         | `resources`, `physical_resources`      | Digital file uploads and physical book inventory tracking.          |
| **5. Gamification**    | `xp_events`, `user_achievements`       | Tracks member progression and daily streaks.                        |
| **6. Finance**         | `finance_budget_requests`              | Organizational accounting and budget approvals.                     |

---

## 👥 Users and Profiles (Identity Layer)

The core identity layer. Supabase Auth (`auth.users`) handles authentication, while our public `profiles` table stores application-specific identity data, enforcing the **Four Status Layers** defined in the RBAC.

### `roles`

Defines the base roles available in the system.

- **`id`** _(uuid, PK)_
- **`name`** _(text, Unique)_ — `tutor`, `learner`, `super_admin`, `administrator`.

### `profiles`

The primary user table. Assembles a user's full identity.

- **`id`** _(uuid, PK)_ — References `auth.users(id)` ON DELETE CASCADE.
- **`role_id`** _(uuid, FK)_ — The user's system role (System Role Overlay layer).
- **`org_assignment_id`** _(uuid, nullable, FK)_ — Link to their current position (Org Position layer).
- **`full_name`** _(text)_
- **`email`** _(text)_
- **`avatar_url`** _(text, nullable)_
- **`membership_classification`** _(text)_ — `regular_member` or `esas_scholar` (Membership layer).
- **`committee`** _(text, nullable)_ — Which committee they belong to (e.g., Main Committees or ESAS Committees).
- **`service_hours_balance`** _(numeric, default 0)_ — Tracks the mandatory 90-hour requirement for ESAS Scholars.
- **`role_expires_at`** _(timestamptz, nullable)_ — When their org role reverts to `tutor`.
- **`booking_suspended_until`** _(timestamptz, nullable)_ — Hard lock on booking capabilities.

> [!CAUTION]
> **The Learner Firewall**: Database triggers must prevent any `profiles` row with a `learner` role_id from being inserted into `org_assignments`. Learners are strictly external.

---

## 🏛️ Organizational Structure

Manages the Honor Society's yearly terms and executive/committee board assignments.

### `org_terms`

Represents an academic year.

- **`id`** _(uuid, PK)_
- **`label`** _(text)_
- **`term_start`** _(date)_
- **`term_end`** _(date)_
- **`is_current`** _(boolean)_

### `org_assignments`

Maps a user to a specific position within a term, representing the Main Committees, ESAS Committees, and the Executives.

- **`id`** _(uuid, PK)_
- **`term_id`** _(uuid, FK)_
- **`user_id`** _(uuid, FK)_
- **`position`** _(text)_ — The explicit org role (e.g., `president`, `committee_head`).
- **`committee`** _(text, nullable)_ — The specific committee assigned.

---

## 📅 Sessions and Tutors (Operations Layer)

Manages the core tutoring capabilities, booking, and attendance tracking for the Peer Learning Center.

### `tutor_profiles`

Extended details specifically for Honor Society members who maintain a Tutor Account.

- **`id`** _(uuid, PK, FK to `profiles`)_
- **`bio`** _(text)_
- **`subjects`** _(text[])_ — Areas of expertise.
- **`rating`** _(numeric, default 5.0)_ — Aggregate peer/student rating.

### `sessions`

Represents a booked tutoring block.

- **`id`** _(uuid, PK)_
- **`tutor_id`** _(uuid, FK)_
- **`student_id`** _(uuid, FK)_
- **`status`** _(text)_ — `pending`, `scheduled`, `completed`, `cancelled`, `no_show`.
- **`duration_minutes`** _(integer)_
- **`max_participants`** _(integer, default 1)_
- **`is_office_hours`** _(boolean, default false)_

### `attendance_logs` / `timesheets`

Tracks tutor presence in the PLC.

- **`id`** _(uuid, PK)_
- **`tutor_id`** _(uuid, FK)_
- **`user_id`** _(uuid, FK)_
- **`clock_in`** _(timestamptz)_
- **`clock_out`** _(timestamptz, nullable)_
- **`last_confirmed_at`** _(timestamptz, default now())_ — Timestamp of last 2-hour facility presence confirmation. Open shifts without confirmation auto-clock out at 2 hours.

> **Note on Service Hours:** ESAS tutors do not have to get a booked session in order to gain credits for their 90 hours. They accumulate credits simply by being clocked in (present) in the PLC via `attendance_logs`. Tutors must confirm presence every 2 hours to maintain an active shift.

---

## 🧠 Quizzes, Flashcards, and SRS (Learning Layer)

The AI-powered study tools and spaced repetition system.

### `study_sets`

- **`id`** _(uuid, PK)_
- **`owner_id`** _(uuid, FK)_
- **`title`** _(text)_

### `study_items`

Individual questions or flashcards.

- **`id`** _(uuid, PK)_
- **`study_set_id`** _(uuid, FK)_
- **`question`** _(text)_
- **`answer`** _(text)_
- **`item_type`** _(text)_
- **`image_url`** _(text, nullable)_
- **`occlusion_masks`** _(jsonb, nullable)_ — Stores coordinates for image occlusion bounding boxes.

### `flashcard_attempts`

Tracks the SM2 spaced repetition algorithm for a specific user and flashcard.

- **`id`** _(uuid, PK)_
- **`user_id`** _(uuid, FK)_
- **`study_set_item_id`** _(uuid, FK)_
- **`ease_factor`** _(numeric)_
- **`interval_days`** _(integer)_
- **`next_review_date`** _(timestamptz)_

---

## 📚 Library and Resources

Digital and Physical asset management for the Peer Learning Center.

### `resources` (Digital)

- **`id`** _(uuid, PK)_
- **`file_url`** _(text)_
- **`is_public`** _(boolean, default false)_
- **`uploaded_by`** _(uuid, FK)_

### `physical_resources` (CFMR Inventory)

- **`id`** _(uuid, PK)_
- **`title`** _(text)_
- **`isbn`** _(text, Unique)_
- **`available_quantity`** _(integer)_

### `resource_checkouts`

- **`id`** _(uuid, PK)_
- **`resource_id`** _(uuid, FK)_
- **`user_id`** _(uuid, FK)_
- **`status`** _(text)_ — `active`, `returned`, `overdue`.

### `resource_embeddings`

- **`id`** _(uuid, PK)_
- **`resource_id`** _(uuid, FK)_
- **`profile_id`** _(uuid, FK)_
- **`content`** _(text)_ — Text chunk from the document.
- **`embedding`** _(jsonb)_ — Vector array (fallback implementation for RAG without `pgvector`).

---

## 🤝 Social and Directory

Manages user connections, directory visibility, and community forums.

### `friends`

- **`id`** _(uuid, PK)_
- **`user_id1`** _(uuid, FK)_ — The initiator.
- **`user_id2`** _(uuid, FK)_ — The receiver.
- **`status`** _(text)_ — `pending`, `accepted`, `declined`, `blocked`. (A status of `blocked` means `user_id1` blocked `user_id2`).

### `forum_posts`

- **`id`** _(uuid, PK)_
- **`author_id`** _(uuid, FK)_
- **`title`** _(text)_
- **`content`** _(text)_
- **`upvotes`** _(integer)_
- **`created_at`** _(timestamptz)_

### `forum_reports`

- **`id`** _(uuid, PK)_
- **`post_id`** _(uuid, FK)_
- **`reporter_id`** _(uuid, FK)_
- **`reason`** _(text)_
- **`status`** _(text)_ — `pending`, `reviewed`, `dismissed`.

---

## 💰 Finance Module

Module for managing organizational funds, strictly guarded by Executive access.

### `finance_budget_requests`

- **`id`** _(uuid, PK)_
- **`activity_title`** _(text)_
- **`amount`** _(numeric)_
- **`status`** _(text)_

### `finance_liquidations`

- **`id`** _(uuid, PK)_
- **`request_id`** _(uuid, FK)_
- **`receipt_urls`** _(text[])_

---

## 🚀 Institutional Journey & Capability Suite Schema (v1)

### `portfolio_settings`

Configures public share tokens and display preferences for member portfolio links.

- **`user_id`** _(uuid, PK, FK to `profiles`)_
- **`share_token`** _(text, Unique, default `gen_random_uuid()`)_
- **`custom_bio`** _(text, nullable)_
- **`linkedin_url`** _(text, nullable)_
- **`github_url`** _(text, nullable)_
- **`show_tutoring_hours`** _(boolean, default true)_
- **`show_subjects_mastered`** _(boolean, default true)_
- **`show_leadership_terms`** _(boolean, default true)_
- **`show_endorsements`** _(boolean, default true)_

### `tutor_endorsements`

Factual peer endorsements for tutors.

- **`id`** _(uuid, PK)_
- **`tutor_id`** _(uuid, FK to `tutors`)_
- **`endorser_id`** _(uuid, FK to `profiles`)_
- **`skill`** _(text)_
- **`comment`** _(text, nullable)_
- **`created_at`** _(timestamptz)_

### `officer_handoff_notes`

Leadership handoff and continuity logs for departing officers.

- **`id`** _(uuid, PK)_
- **`position`** _(text)_ — e.g. `president`, `academic_head`.
- **`committee`** _(text, nullable)_
- **`outgoing_officer_id`** _(uuid, FK to `profiles`)_
- **`notes`** _(text)_
- **`key_contacts`** _(text, nullable)_
- **`created_at`** _(timestamptz)_

### `mentorship_preferences`

Member mentorship pool participation settings.

- **`user_id`** _(uuid, PK, FK to `profiles`)_
- **`is_available`** _(boolean, default true)_
- **`preferred_topics`** _(text[])_
- **`bio`** _(text, nullable)_
- **`updated_at`** _(timestamptz)_

### `milestone_events`

Database persistence to ensure single-trigger milestone celebrations.

- **`id`** _(uuid, PK)_
- **`user_id`** _(uuid, FK to `profiles`)_
- **`milestone_type`** _(text)_ — e.g. `100_hours_tutored`, `officer_term_completed`.
- **`title`** _(text)_
- **`triggered_at`** _(timestamptz)_

### `institutional_wiki_docs`

Document store for the RAG search engine across org SOPs, governance, and manuals.

- **`id`** _(uuid, PK)_
- **`title`** _(text)_
- **`category`** _(text)_ — `sop`, `governance`, `tutor_manual`, `faq`.
- **`content`** _(text)_
- **`min_role`** _(text, default 'learner')_
- **`author`** _(text, nullable)_
- **`updated_at`** _(timestamptz)_

---

## ⚙️ Critical Database Triggers and Functions

| Trigger Name                         | Purpose                                                                                   | Rule Enforcement                                                      |
| ------------------------------------ | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **`trg_enforce_single_super_admin`** | Prevents multiple rows in `profiles` from holding the `super_admin` role_id concurrently. | Ensures only one `super_admin` exists system-wide.                    |
| **`calculate_xp_curve`**             | Computes a user's `current_level` based on their `total_xp`.                              | Gamification auto-scaling.                                            |
| **`tutor_analytics_trigger`**        | Automatically increments `total_sessions` and awards XP upon completion of a session.     | Maintains data integrity without requiring backend API orchestration. |
| **`increment_rate_limit`**           | Atomically increments rate limit timestamp arrays in `ratelimit_windows`.                 | Prevents concurrency race conditions during rate limiting checks.     |
