# ScholarMe

**ScholarMe** is a full-stack academic management platform built for honor society organizations. It serves as a centralized hub for managing tutoring sessions, organizational finances, gamified learning, member identity, and internal communications — all delivered through a single, unified web application.

---

## 📖 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Authentication & Identity](#authentication--identity)
- [Gamification Engine](#gamification-engine)
- [CI/CD Pipeline](#cicd-pipeline)
- [Development Workflow](#development-workflow)

---

## Overview

ScholarMe was built to replace disconnected spreadsheets, manual session logs, and paper-based processes for an academic honor society. It provides distinct role-based experiences for three primary user types:

- **Learners** — Browse tutors, book sessions, vote in polls, study with AI-generated flashcards and quizzes, track their XP and level, and manage their digital identity.
- **Tutors** — Manage availability, track session history, clock in and out of timesheets, and build a public profile with specializations and ratings.
- **Admins / Officers** — Oversee all users, manage finance workflows, track organizational tasks, view system analytics, run Hall of Fame reports, issue physical ID cards, and configure system-wide settings.

---

## Features

### 🔐 Authentication & Access Control

- **Dual-mode login**: Email/Password for personal devices; Card ID + PIN for institutional kiosks.
- **Role-Based Access Control (RBAC)**: Four tiers — Learner, Tutor, Officer/Admin, and Super Admin. Each tier unlocks progressively more powerful dashboard sections.
- **Super Admin designation**: Independently tracked from the base role, ensuring no privilege escalation through standard role editing.
- **Session management**: Powered by Supabase Auth with server-side cookie handling via `@supabase/ssr`.

### 👤 Profiles & Onboarding

- Guided multi-step onboarding flow that collects profile details, academic info, and terms acceptance.
- Profile completion gating — users are redirected to onboarding until all required fields are filled.
- Tutors have an extended profile with bio, hourly rate, years of experience, and specializations (all required during registration).
- Profile picture upload with cropping, stored in Supabase Storage (Vercel Blob as fallback).
- Dynamic Digital ID Card that renders the user's unique ID number, QR code, Honor Society designation, level, and current academic year.

### 🎓 Tutoring System

- **Find Tutors**: Browse and filter active tutors by specialization, availability, and rating. Learner, Admin, and Super Admin accounts are explicitly excluded from appearing here.
- **Tutor Availability**: Tutors set their weekly availability slots (day of week, start/end time). Learners book sessions against these slots.
- **Session Booking & Management**: Full lifecycle — `pending → confirmed → completed / cancelled`. Cancellation reason is captured.
- **Session Ratings**: Learners submit a 1–5 star rating and written feedback after a session completes.
- **Tutor Metrics** (auto-calculated by database trigger):
  - `total_sessions_completed`
  - `total_hours_tutored`
  - `total_students_helped`
  - `response_rate`

### 🏅 Gamification Engine

- **XP System**: Users earn XP for completing sessions, quiz attempts, and resource contributions.
- **Level Formula**: `Level = FLOOR(0.1 × SQRT(total_xp)) + 1` — an exponential curve that rewards consistency over grinding.
- **Tutor XP Bonus**: Tutors automatically earn **50 XP per hour** of tutoring, credited the moment a session is marked `completed` by a database trigger.
- **Leaderboards**: Real-time rankings for top students and tutors. Separate Hall of Fame RPCs (`best_week`, `best_month`, `most_hours_overall`) surface standout performers in the Admin Analytics panel.
- **Level Titles & Colored Avatar Borders**: Visible on profile cards, leaderboard rows, and the Digital ID Card.
- **XP Logs**: Every XP event is recorded in the `xp_logs` table with a reason string for auditability.

### 📚 Study & AI Generation Suite

- **Study Sets**: Users create study sets manually or from uploaded files, choosing from `flashcard`, `multiple_choice`, `true_false`, `identification`, or `matching` modes.
- **AI Generation**: Powered by **Google Gemini** (`@google/genai`). Users describe a topic and the AI generates a full set of questions and answers.
- **Quiz Attempts**: Tracked in `quiz_attempts` with score, time spent, and individual answers stored as JSONB for detailed review.
- **File Uploads**: Users can upload documents; extracted text is stored in `user_uploads` and used as source material for AI generation.

### 📂 Resource Repository

- Admins and Tutors create repositories with optional access control (`all`, `tutor`, `admin`).
- Resources within repositories store a title, description, URL, and file type.
- Learners browse public repositories; restricted ones are hidden based on their role.

### 💬 Real-Time Messaging

- **Conversations & Participants**: A `conversations` table with a `conversation_participants` join table supports both 1-on-1 and group threads.
- **Live chat**: Powered by **Supabase Realtime** (`postgres_changes`). New messages appear instantly without page refresh.
- **File attachments**: Users can send files within conversations. Metadata (name, type, size) is stored alongside the message.
- **Unread tracking**: `last_read_at` timestamps on `conversation_participants` power unread badge counts.

### 🔔 Notifications & Web Push

- In-app notifications stored in the `notifications` table with types: `session`, `system`, `resource`, `message`.
- **Web Push (VAPID)**: Browser-based push notifications for events like session confirmations. Push subscriptions are stored per device in `push_subscriptions`.
- **Firebase Admin SDK** integrated for cross-platform push delivery fallback.
- Unread notification count badge visible in the top navigation bar.

### 🗳️ Organization Voting (Polls)

- Admins create polls with a title, description, start/end date, and one or more options.
- Polls support `allow_multiple_votes` and `is_anonymous` flags.
- Past polls are hidden from Learners but remain visible and editable for Admins.
- Poll history is accessible via a Dialog Modal to keep the voting UI clean.
- Results display live vote counts per option.

### ⏱️ Timesheets

- Tutors clock in and out via a dedicated Timesheet page.
- Timesheets are tied to configurable **Timesheet Periods** (defined by Admins with a start and end date, with only one active period at a time).
- Admins can view all tutor timesheets, filter by period, and export summaries.

### 💰 Finance Module

- Role-gated to Finance Managers, Treasurers, and Auditors.
- **Budget Requests**: Submit, review, and approve/reject activity budget requests with a breakdown and optional attachment.
- **Petty Cash**: Track petty cash disbursements, linked back to approved budget requests.
- **Liquidations**: Submit proof-of-payment and receipts to liquidate approved requests. Late submissions are flagged automatically.
- **SCARDS**: Summary Cards with receipt totals, disbursement totals, and running balances. Supports cosigning and versioning.
- **Audit Findings**: Auditors log findings against SCARDS entries, track resolution status.
- **Save Draft**: Budget Requests and Petty Cash forms support saving a draft before final submission.
- All `finance_*` tables are protected by strict PostgreSQL Row Level Security policies.

### 🗂️ Teamwork Tracker

- Officers and Admins manage committee deliverables in a Kanban-style task board (`todo → in_progress → done`).
- Tasks include a deadline, assignee, and committee tag.
- Team schedules allow members to log upcoming activities by date.
- RLS enforced: only Officers can modify executive tasks.

### 🖥️ Admin Command Center

- **User Management**: Create, edit, deactivate, and reassign roles for all users. Issue physical ID cards and track `is_card_issued` status.
- **Session Management**: View all sessions across the platform, filter by status, tutor, or learner.
- **Analytics Dashboard**: KPIs including active tutors, total sessions, new users this month. Tutor leaderboard with graphical performance charts (Recharts).
- **Hall of Fame**: Top tutors by week, month, and all-time hours tutored.
- **Logs**: Full analytics event log (`analytics_logs`) for audit trails — action type, entity, metadata, and timestamp.
- **Feedback**: Super Admins review user-submitted system feedback from a dedicated `/admin/feedback` page.
- **Role Management**: Create and manage organization roles.
- **ID Scanner**: Web-based QR scanner (using device camera via `html5-qrcode`) to instantly verify a student's digital ID card.
- **Timesheet Admin**: Review all tutor clock-in/clock-out records.
- **Honor Society Designations**: Assign and manage HS designations (Member, ESAS Scholar, Officer, Administrator, Super Admin) with academic year tracking.
- **Semester Config**: Define active semesters with start and end dates.

---

## Tech Stack

| Layer                    | Technology                                                                                                     |
| :----------------------- | :------------------------------------------------------------------------------------------------------------- |
| **Framework**            | [Next.js 16.2](https://nextjs.org) — App Router, Server Actions, Serverless API Routes                         |
| **Frontend**             | [React 19](https://react.dev) + [Tailwind CSS v4](https://tailwindcss.com)                                     |
| **Backend-as-a-Service** | [Supabase](https://supabase.com) — PostgreSQL, Auth, Realtime, Storage                                         |
| **Language**             | [TypeScript 5.7](https://www.typescriptlang.org/) — `strict: true` enforced                                    |
| **UI Components**        | [shadcn/ui](https://ui.shadcn.com) + [Radix UI](https://www.radix-ui.com) + [Lucide Icons](https://lucide.dev) |
| **Charts**               | [Recharts](https://recharts.org)                                                                               |
| **AI**                   | [Google Gemini](https://ai.google.dev) via `@google/genai`                                                     |
| **Forms**                | [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev)                                        |
| **Real-Time**            | [Supabase Realtime](https://supabase.com/realtime) — `postgres_changes` + Broadcast                            |
| **File Storage**         | [Vercel Blob](https://vercel.com/storage/blob) + Supabase Storage                                              |
| **Push Notifications**   | [Web Push (VAPID)](https://web.dev/push-notifications-overview/) + Firebase Admin                              |
| **Email**                | [Resend](https://resend.com)                                                                                   |
| **QR Scanning**          | [html5-qrcode](https://github.com/mebjas/html5-qrcode)                                                         |
| **QR Generation**        | [qrcode.react](https://github.com/zpao/qrcode.react)                                                           |
| **Data Fetching**        | [SWR](https://swr.vercel.app)                                                                                  |
| **Animations**           | [Framer Motion](https://www.framer.com/motion/)                                                                |
| **Date Handling**        | [date-fns](https://date-fns.org)                                                                               |
| **Testing**              | [Vitest](https://vitest.dev) + [React Testing Library](https://testing-library.com)                            |
| **Linting/Formatting**   | ESLint + Prettier + Husky (pre-commit hooks)                                                                   |
| **Deployment**           | [Vercel](https://vercel.com) (web) + GitHub Actions (CI/CD)                                                    |

---

## Project Structure

```
scholarme/
├── app/                          # Next.js App Router
│   ├── actions/                  # Server Actions (team, sessions, etc.)
│   ├── api/                      # Serverless API routes
│   │   ├── auth/                 # Auth callbacks and card login
│   │   ├── feedback/             # User feedback submission
│   │   ├── notifications/        # Push notification dispatch
│   │   ├── push/                 # VAPID web push subscription
│   │   ├── study-sets/           # AI generation endpoints
│   │   └── uploads/              # File upload handling
│   ├── auth/                     # Login, signup, and onboarding pages
│   └── dashboard/                # All role-specific dashboard pages
│       ├── admin/                # Admin-only tools
│       │   ├── analytics/        # KPIs, leaderboards, Hall of Fame
│       │   ├── feedback/         # Super Admin feedback review
│       │   ├── logs/             # Analytics event logs
│       │   ├── messages/         # Admin messaging
│       │   ├── reports/          # Reporting tools
│       │   ├── roles/            # Role management
│       │   ├── scanner/          # QR ID scanner
│       │   ├── sessions/         # Session oversight
│       │   ├── timesheets/       # Tutor timesheet review
│       │   ├── tutor-stats/      # Tutor performance stats
│       │   └── users/            # User management
│       ├── availability/         # Tutor availability settings
│       ├── finance/              # Finance module (requests, petty cash, etc.)
│       ├── flashcards/           # AI flashcard study sets
│       ├── home/                 # Role-aware dashboard home
│       ├── leaderboard/          # XP leaderboard
│       ├── messages/             # Real-time messaging
│       ├── notifications/        # Notification center
│       ├── profile/              # User profile + Digital ID Card
│       ├── quizzes/              # AI quiz generation & attempts
│       ├── resources/            # Resource repository browser
│       ├── sessions/             # Session booking & history
│       ├── team/                 # Teamwork tracker (officers only)
│       ├── timesheet/            # Tutor timesheet clock-in/out
│       ├── tutors/               # Find & browse tutors
│       └── voting/               # Organization polls & voting
├── components/                   # Reusable cross-cutting UI components
│   ├── landing/                  # Landing page specific components
│   └── ui/                       # shadcn/ui primitives
├── features/                     # Domain-Driven Design (DDD) feature modules
│   ├── admin/                    # Admin tools, user management, and roles
│   ├── finance/                  # Finance module logic and SCARDS
│   ├── profiles/                 # Profile management and onboarding
│   ├── quizzes/                  # AI generation, flashcards, study sets
│   ├── sessions/                 # Tutoring session booking and logic
│   └── tutors/                   # Tutor availability and discovery
├── hooks/                        # Custom React hooks
├── lib/                          # Shared utilities & database clients
│   ├── supabase*.ts              # Supabase client factories (server, client, admin)
│   ├── user-context.tsx          # Global auth context provider
│   ├── env.ts                    # Environment variable validation on startup
│   └── rate-limit.ts             # Rate limiting (Supabase-backed)
├── scripts/                      # Dev utility scripts
├── supabase/
│   └── migrations/               # Chronological SQL migration files
├── types/                        # TypeScript type declarations
├── __tests__/                    # Vitest test suite
├── .github/
│   └── workflows/
│       └── ci.yml                # GitHub Actions CI/CD pipeline
└── public/                       # Static assets
```

---

## Database Schema

The PostgreSQL database (hosted on Supabase) contains the following core tables:

| Table                       | Purpose                                                |
| :-------------------------- | :----------------------------------------------------- |
| `roles`                     | Defines user roles (Learner, Tutor, Admin, etc.)       |
| `profiles`                  | Core user record — extends Supabase Auth users         |
| `auth_cards`                | Physical card credentials (card_id + hashed PIN)       |
| `tutors`                    | Tutor-specific metadata and statistics                 |
| `tutor_specializations`     | Many-to-many link between tutors and subjects          |
| `tutor_availability`        | Weekly availability slots per tutor                    |
| `specializations`           | Subject/topic catalog                                  |
| `sessions`                  | Tutoring session records with full lifecycle status    |
| `session_ratings`           | Learner ratings and feedback per session               |
| `timesheets`                | Tutor clock-in/clock-out records                       |
| `timesheet_periods`         | Admin-configured active timesheet periods              |
| `repositories`              | Knowledge repositories with access control             |
| `resources`                 | Files/links within repositories                        |
| `notifications`             | In-app notification records                            |
| `conversations`             | Chat thread metadata                                   |
| `conversation_participants` | Members and read state per thread                      |
| `messages`                  | Individual chat messages with file attachment metadata |
| `polls`                     | Organization polls                                     |
| `poll_options`              | Available choices per poll                             |
| `user_votes`                | Vote records per user per option                       |
| `study_sets`                | AI-generated or manual study sets                      |
| `study_set_items`           | Individual questions/cards within a set                |
| `quiz_attempts`             | User quiz attempt records with JSONB answers           |
| `user_uploads`              | Uploaded file metadata and extracted text              |
| `xp_logs`                   | Audit log of every XP event                            |
| `analytics_logs`            | Platform-wide action telemetry                         |
| `push_subscriptions`        | Web Push VAPID subscription objects                    |
| `device_tokens`             | FCM device tokens for push delivery                    |
| `hs_designations`           | Honor Society designations per user per academic year  |
| `semester_configs`          | Active semester definitions                            |
| `finance_budget_requests`   | Activity budget request workflow                       |
| `finance_petty_cash`        | Petty cash disbursement records                        |
| `finance_liquidations`      | Proof-of-payment liquidation submissions               |
| `finance_scards`            | Summary Cards for financial auditing                   |
| `finance_audit_findings`    | Auditor findings against SCARDS                        |
| `team_tasks`                | Committee deliverables and task tracking               |
| `team_schedules`            | Member activity schedules                              |
| `system_feedback`           | User-submitted platform feedback                       |
| `ratelimit_windows`         | Supabase-backed sliding-window rate limiting           |

Row Level Security (RLS) is enabled across all tables containing user data. Policies are defined per role and operation in the migration files under `supabase/migrations/`.

---

## Getting Started

### Prerequisites

- **Node.js** 24+
- **pnpm** (required — used as the package manager)
- A **Supabase** project (free tier works)

### Local Setup

1. **Clone the repository**:

   ```bash
   git clone https://github.com/PerpyVanitas/ScholarMe.git
   cd ScholarMe
   ```

2. **Install dependencies**:

   ```bash
   pnpm install
   ```

3. **Configure environment variables**:
   Copy `.env.example` to `.env.local` and fill in your values:

   ```bash
   cp .env.example .env.local
   ```

   Required variables:

   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   GOOGLE_GENERATIVE_AI_API_KEY=
   BLOB_READ_WRITE_TOKEN=
   ```

4. **Apply database migrations**:

   ```bash
   npx supabase db push --include-all
   ```

   Or paste the files from `supabase/migrations/` in order into the Supabase SQL Editor.

5. **Start the development server**:
   ```bash
   pnpm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

---

## Authentication & Identity

ScholarMe implements a **dual-authentication system**:

1. **Email / Password** — Standard Supabase Auth for personal device login.
2. **Card ID + PIN** — Institutional kiosk login. A user's `auth_card` stores the card ID and a hashed PIN. An API route validates the credentials and returns a session.

Every user has a **Digital ID Card** that renders:

- Full name and photo
- Unique membership number (e.g., `MJJ-2627-0001`)
- Current academic year, degree program, and year level
- Honor Society designation badge
- XP level with colored border
- A scannable QR code encoding the user's unique ID

Admins use the **Identity Scanner** page (powered by `html5-qrcode` and the device camera) to scan a QR code and instantly verify a student's identity, status, and designation.

---

## Gamification Engine

| Mechanic          | Detail                                                                    |
| :---------------- | :------------------------------------------------------------------------ |
| **XP Earning**    | Sessions, quiz completions, resource contributions                        |
| **Tutor Bonus**   | 50 XP per hour automatically awarded via DB trigger on session completion |
| **Level Formula** | `FLOOR(0.1 × SQRT(total_xp)) + 1`                                         |
| **Leaderboard**   | Real-time global ranking by total XP                                      |
| **Hall of Fame**  | Best tutor by week, month, and all-time hours (via Postgres RPCs)         |
| **XP Audit**      | All events logged to `xp_logs` with reason string                         |

---

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push to `main`:

| Job                   | What it does                                                  |
| :-------------------- | :------------------------------------------------------------ |
| `secret-scan`         | Scans commits for leaked secrets using TruffleHog             |
| `web-build`           | Installs dependencies and runs `next build`                   |
| `web-test`            | Runs the Vitest test suite                                    |
| `accessibility-audit` | Runs `axe-core` against the live development server           |
| `deploy-web`          | Deploys to Vercel production using `amondnet/vercel-action`   |
| `deploy-db`           | Runs `supabase db push --include-all` to apply new migrations |

Required GitHub Secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_ID`, `SUPABASE_DB_PASSWORD`.

---

## Development Workflow

```bash
# Start local dev server
pnpm run dev

# Type-check without building
npx tsc --noEmit

# Run all tests
pnpm run test

# Lint and auto-fix
pnpm run lint

# Format all files
pnpm run format

# Build for production (validates everything)
pnpm run build
```

New database changes should be written as a new `.sql` file in `supabase/migrations/` with a timestamp prefix (e.g., `20260706120000_my_change.sql`). Once pushed to `main`, the CI pipeline will automatically apply the migration to the production database.
