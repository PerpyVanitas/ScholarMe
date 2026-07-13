# ScholarMe — Database Schema Reference

> This document is the **authoritative database schema reference** for ScholarMe.  
> When performing migrations, tracking foreign keys, or debugging data loss, **this file wins**.  
> Last updated: 2026-07-13

---

## Schema Architecture Overview

ScholarMe uses a **relational Postgres database** (hosted via Supabase), leveraging heavily on Row Level Security (RLS) to enforce the rules established in the [RBAC Reference](./rbac.md).

### Core Data Layers

The database is divided into distinct domains:

| Layer | Primary Tables | Description |
|-------|----------------|-------------|
| **1. Identity & RBAC** | `profiles`, `roles`, `org_assignments` | Maps users to their Honor Society roles and permissions. |
| **2. Operations** | `sessions`, `attendance_logs` | The core Peer Learning Center (PLC) tutoring and scheduling engine. |
| **3. Learning** | `study_sets`, `flashcard_attempts` | The AI-powered content and Spaced Repetition System (SRS). |
| **4. Library** | `resources`, `physical_resources` | Digital file uploads and physical book inventory tracking. |
| **5. Gamification** | `xp_events`, `user_achievements` | Tracks member progression and daily streaks. |
| **6. Finance** | `finance_budget_requests` | Organizational accounting and budget approvals. |

---

## 👥 Users and Profiles (Identity Layer)

The core identity layer. Supabase Auth (`auth.users`) handles authentication, while our public `profiles` table stores application-specific identity data, enforcing the **Four Status Layers** defined in the RBAC.

### `roles`
Defines the base roles available in the system.
- **`id`** *(uuid, PK)*
- **`name`** *(text, Unique)* — `tutor`, `learner`, `super_admin`, `administrator`.

### `profiles`
The primary user table. Assembles a user's full identity.
- **`id`** *(uuid, PK)* — References `auth.users(id)` ON DELETE CASCADE.
- **`role_id`** *(uuid, FK)* — The user's system role (System Role Overlay layer).
- **`org_assignment_id`** *(uuid, nullable, FK)* — Link to their current position (Org Position layer).
- **`full_name`** *(text)*
- **`email`** *(text)*
- **`avatar_url`** *(text, nullable)*
- **`membership_classification`** *(text)* — `regular_member` or `esas_scholar` (Membership layer).
- **`committee`** *(text, nullable)* — Which committee they belong to (e.g., Main Committees or ESAS Committees).
- **`service_hours_balance`** *(numeric, default 0)* — Tracks the mandatory 90-hour requirement for ESAS Scholars. 
- **`role_expires_at`** *(timestamptz, nullable)* — When their org role reverts to `tutor`.
- **`booking_suspended_until`** *(timestamptz, nullable)* — Hard lock on booking capabilities.

> [!CAUTION]
> **The Learner Firewall**: Database triggers must prevent any `profiles` row with a `learner` role_id from being inserted into `org_assignments`. Learners are strictly external.

---

## 🏛️ Organizational Structure

Manages the Honor Society's yearly terms and executive/committee board assignments.

### `org_terms`
Represents an academic year.
- **`id`** *(uuid, PK)*
- **`label`** *(text)*
- **`term_start`** *(date)*
- **`term_end`** *(date)*
- **`is_current`** *(boolean)*

### `org_assignments`
Maps a user to a specific position within a term, representing the Main Committees, ESAS Committees, and the Executives.
- **`id`** *(uuid, PK)*
- **`term_id`** *(uuid, FK)*
- **`user_id`** *(uuid, FK)*
- **`position`** *(text)* — The explicit org role (e.g., `president`, `committee_head`).
- **`committee`** *(text, nullable)* — The specific committee assigned.

---

## 📅 Sessions and Tutors (Operations Layer)

Manages the core tutoring capabilities, booking, and attendance tracking for the Peer Learning Center.

### `tutor_profiles`
Extended details specifically for Honor Society members who maintain a Tutor Account.
- **`id`** *(uuid, PK, FK to `profiles`)*
- **`bio`** *(text)*
- **`subjects`** *(text[])* — Areas of expertise.
- **`rating`** *(numeric, default 5.0)* — Aggregate peer/student rating.

### `sessions`
Represents a booked tutoring block.
- **`id`** *(uuid, PK)*
- **`tutor_id`** *(uuid, FK)*
- **`student_id`** *(uuid, FK)*
- **`status`** *(text)* — `pending`, `scheduled`, `completed`, `cancelled`, `no_show`.
- **`duration_minutes`** *(integer)*
- **`max_participants`** *(integer, default 1)*
- **`is_office_hours`** *(boolean, default false)*

### `attendance_logs`
Tracks tutor presence in the PLC.
- **`id`** *(uuid, PK)*
- **`tutor_id`** *(uuid, FK)*
- **`clock_in`** *(timestamptz)*
- **`clock_out`** *(timestamptz, nullable)*

> **Note on Service Hours:** ESAS tutors do not have to get a booked session in order to gain credits for their 90 hours. They accumulate credits simply by being clocked in (present) in the PLC via `attendance_logs`.

---

## 🧠 Quizzes, Flashcards, and SRS (Learning Layer)

The AI-powered study tools and spaced repetition system.

### `study_sets`
- **`id`** *(uuid, PK)*
- **`owner_id`** *(uuid, FK)*
- **`title`** *(text)*

### `study_items`
Individual questions or flashcards.
- **`id`** *(uuid, PK)*
- **`study_set_id`** *(uuid, FK)*
- **`question`** *(text)*
- **`answer`** *(text)*
- **`item_type`** *(text)*
- **`image_url`** *(text, nullable)*
- **`occlusion_masks`** *(jsonb, nullable)* — Stores coordinates for image occlusion bounding boxes.

### `flashcard_attempts`
Tracks the SM2 spaced repetition algorithm for a specific user and flashcard.
- **`id`** *(uuid, PK)*
- **`user_id`** *(uuid, FK)*
- **`study_set_item_id`** *(uuid, FK)*
- **`ease_factor`** *(numeric)*
- **`interval_days`** *(integer)*
- **`next_review_date`** *(timestamptz)*

---

## 📚 Library and Resources

Digital and Physical asset management for the Peer Learning Center.

### `resources` (Digital)
- **`id`** *(uuid, PK)*
- **`file_url`** *(text)*
- **`is_public`** *(boolean, default false)*
- **`uploaded_by`** *(uuid, FK)*

### `physical_resources` (CFMR Inventory)
- **`id`** *(uuid, PK)*
- **`title`** *(text)*
- **`isbn`** *(text, Unique)*
- **`available_quantity`** *(integer)*

### `resource_checkouts`
- **`id`** *(uuid, PK)*
- **`resource_id`** *(uuid, FK)*
- **`user_id`** *(uuid, FK)*
- **`status`** *(text)* — `active`, `returned`, `overdue`.

---

## 💰 Finance Module

Module for managing organizational funds, strictly guarded by Executive access.

### `finance_budget_requests`
- **`id`** *(uuid, PK)*
- **`activity_title`** *(text)*
- **`amount`** *(numeric)*
- **`status`** *(text)*

### `finance_liquidations`
- **`id`** *(uuid, PK)*
- **`request_id`** *(uuid, FK)*
- **`receipt_urls`** *(text[])*

---

## ⚙️ Critical Database Triggers and Functions

| Trigger Name | Purpose | Rule Enforcement |
|--------------|---------|------------------|
| **`trg_enforce_single_super_admin`** | Prevents multiple rows in `profiles` from holding the `super_admin` role_id concurrently. | Ensures only one `super_admin` exists system-wide. |
| **`calculate_xp_curve`** | Computes a user's `current_level` based on their `total_xp`. | Gamification auto-scaling. |
| **`tutor_analytics_trigger`** | Automatically increments `total_sessions` and awards XP upon completion of a session. | Maintains data integrity without requiring backend API orchestration. |
