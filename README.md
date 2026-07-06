# ScholarMe

A high-performance academic management ecosystem built exclusively as a **Web Application** using **Next.js**, **React 19**, and **Supabase**. ScholarMe bridges the gap between digital management and physical tutoring through real-time engagement, gamified learning, and secure identity verification directly in the browser.

**SSD Compliance:** 100% - All MUST-HAVE, SHOULD-HAVE, and COULD-HAVE features implemented per System Design Document.

---

## 📖 Table of Contents

- [What's New](#whats-new-latest-updates)
- [Features](#features)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Authentication & Identity](#authentication--identity)
- [Gamification Engine](#gamification-engine)
- [Error Handling](#error-handling)
- [Enterprise Standards & Testing](#enterprise-standards--testing)

---

## 🆕 What's New (Latest Updates)

- **Enterprise Security & RLS**: Completely locked down organizational financial data by implementing strict PostgreSQL Row Level Security (RLS) on all `finance_*` tables. Patched IDOR/BOLA vulnerabilities in the Teamwork tracker.
- **Architectural Refactoring**: Eliminated massive "God Objects" (`admin/users/page.tsx` and `profile/page.tsx`) by adopting a modular, component-driven approach for all modals and states.
- **Tutor Analytics System**: Introduced database triggers to automatically track tutor metrics (sessions completed, hours tutored, students helped) and real-time XP gamification logic.
- **Query Optimization & Type Safety**: Replaced blanket `SELECT *` queries with strict explicit selections across database calls and enforced rigorous TypeScript schemas in place of `any` overrides.
- **Finance Drafts**: Implement "Save Draft" functionalities for Petty Cash and Budget requests, empowering a more robust review workflow.
- **Global Design System**: Abstracted hardcoded Tailwind colors to dynamically adaptive CSS variables (`hsl(var(--primary))`) ensuring optimal cross-mode aesthetics.

---

## ✨ Features

### 🏛️ Core Platform (SSD MUST-HAVE)

- **Multi-Modal Authentication**: Card ID + PIN (Web Kiosk mode) and Email/Password (Personal).
- **User & Role Management**: RBAC for Learners, Tutors, and Administrators.
- **Tutor Scheduling**: Real-time availability management and session booking.
- **Resource Repository**: Secure knowledge sharing with role-based access control.
- **In-App Notifications**: Real-time activity feeds with unread badge tracking via Web Push.
- **Admin Command Center**: Centralized oversight for users, sessions, and system analytics.
- **Finance Module**: Comprehensive RBAC-gated management for Budget Requests, Petty Cash, Liquidations, and SCARDS Audits.
- **Teamwork Tracker**: Collaborative task tracking and timeline management exclusive to organizational officers.

### 🎮 Engagement & Growth (SSD SHOULD/COULD-HAVE)

- **Gamification Engine**: XP-based progression, leveling system, and global leaderboards.
- **Real-Time Messaging**: WebSocket-driven chat with instant web sync.
- **Organization Voting**: Transparent poll management for organizational decisions, featuring secure RBAC (hidden past polls for learners, editable by admins).
- **Study & Quiz Suite**: Automated flashcard and quiz generation from study sets.
- **Push Notification Engine**: Web Push (VAPID) for browser-based alerts.
- **Identity Scanner**: Web-based QR scanner for instant student verification via device cameras.

### 💼 RBAC & Roles (SSD MUST-HAVE)

- **Strict Role-Based Access Control**: Securely limits administrative commands (e.g., role assignment and Super Admin designation assignment) strictly to `super_admin` users, guarding against privilege escalation.
- **Dynamic ID Cards**: ID Cards dynamically adapt their prefix (e.g. `MJJ-2627-`) and President display based on the current active Academic Year, ensuring seamless organizational transitions year-over-year.

### 💻 Web-First Experience

- **Responsive Design**: 100% modern UI built with Next.js App Router and Tailwind CSS v4, optimized for desktop, tablet, and mobile browsers.
- **Gamification & XP Integration**: Real-time XP rewarding system featuring dynamic Level Titles, Colored Avatar borders, and Leaderboards.
- **AI Generation Studio**: Web-based creation screens for generating Study Quizzes and Flashcards.
- **Digital ID & Designations**: High-contrast, brand-aligned identity cards rendering Honor Society Designations and dynamic QR generation.
- **Offline Resilience**: Progressive Web App (PWA) capabilities and browser-based offline storage for resource viewing.

---

## 🛠️ Architecture & Tech Stack

| Layer                    | Technology                                                                                                                |
| :----------------------- | :------------------------------------------------------------------------------------------------------------------------ |
| **Framework**            | [Next.js](https://nextjs.org) (App Router, Server Actions, Serverless API Routes)                                         |
| **Frontend**             | [React 19](https://react.dev) + [Tailwind CSS v4](https://tailwindcss.com)                                                |
| **BaaS / Database**      | [Supabase](https://supabase.com) (PostgreSQL, Auth, Realtime, Storage)                                                    |
| **Language**             | [TypeScript](https://www.typescriptlang.org/) (Strict mode)                                                               |
| **Real-Time**            | [Supabase Realtime](https://supabase.com/realtime) (PostgreSQL Changes, Broadcast)                                        |
| **Styling & Components** | [shadcn/ui](https://ui.shadcn.com) + [Lucide Icons](https://lucide.dev) + [Framer Motion](https://www.framer.com/motion/) |
| **Testing Suite**        | [Vitest](https://vitest.dev) + [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)     |

---

## 📁 Project Structure

The codebase is organized into several top-level directories to separate concerns across the Next.js full-stack architecture:

```text
.
├── app/                    # Next.js App Router root (Unified Web & API Layer)
│   ├── admin/              # Admin dashboard pages and layouts
│   ├── api/                # RESTful endpoints and Serverless APIs
│   ├── dashboard/          # Role-specific UI slices (home, profile, resources)
│   └── auth/               # Authentication routes (login, setup profile)
├── components/             # Reusable UI components (shadcn/ui, layout elements)
├── docs/                   # Project documentation, architectures, and guides
├── features/               # Cross-cutting business logic by domain (Auth, Gamification, Sessions, etc.)
├── hooks/                  # Custom React hooks used across the web app
├── lib/                    # Shared utilities (Supabase Client, API configs, types)
├── public/                 # Static assets (images, icons, fonts, manifest)
├── scripts/                # Utility scripts for development, testing, and migration
├── styles/                 # Global CSS stylesheets
├── supabase/               # Supabase configuration and SQL migrations
└── types/                  # TypeScript type declarations (including Supabase schema types)
```

_(Note: Previous native mobile, React Native, and Java backend architectures have been deprecated and removed. ScholarMe is now a unified 100% web-based application.)_

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Supabase Project

### Quick Setup

1. **Clone & Install**:
   ```bash
   git clone https://github.com/your-org/scholarme.git
   cd scholarme
   pnpm install
   ```
2. **Environment**:
   Copy `.env.example` to `.env.local` and add your Supabase credentials (URL, Anon Key, Service Role Key).
3. **Database**:
   Run the scripts in `supabase/migrations/` sequentially in your Supabase SQL Editor to define the schema, tables, and security policies. Alternatively, use the Supabase CLI to push migrations.
4. **Launch Web Dashboard**:
   ```bash
   pnpm run dev
   ```

---

## 🆔 Authentication & Identity

ScholarMe implements a **Dual-Identity System** entirely on the web:

1. **Digital Persona**: Email-based accounts for personal device access.
2. **Physical Identity**: Card-based login (ID + PIN) for institutional kiosks (running via the web interface).
3. **QR Verification**: Every user has a unique **Digital ID Card** tied to their Student ID number. Admins use the web-based **Identity Scanner** (utilizing the device camera via WebRTC) to verify status, XP, active sessions, and Honor Society designations instantly.

---

## 🏆 Gamification Engine

The system uses a **Reactive XP Logic** to drive engagement:

- **Earn XP**: Awarded for session completion, quiz scores, and resource contributions.
- **Level Up**: Automatic level progression based on XP thresholds.
- **Leaderboards**: Real-time ranking of top students and tutors across the organization.

---

## 📊 Error Handling & API Contract

ScholarMe APIs and Server Actions adhere to the **SSD Standard Response Format**:

```json
{
  "success": boolean,
  "data": object | null,
  "error": {
    "code": "AUTH-001 | BUS-001 | etc.",
    "message": "Human-readable message",
    "details": "Technical breakdown"
  },
  "timestamp": "ISO-8601"
}
```

_Over 50 unique error codes are handled with localized messages and automated retry logic built into our API client._

---

## 🛡️ Enterprise Standards & Testing

ScholarMe enforces enterprise-grade security and reliability standards:

- **Request Sanitization**: Next.js route inputs and Server Actions are validated using strict schemas (e.g., `zod`) to prevent injection attacks and illegal database states.
- **Row Level Security (RLS)**: Deeply integrated Supabase RLS ensures data isolation at the database tier.
- **Response Caching**: Volatile, read-heavy directories (e.g., leaderboard and tutors) implement Next.js caching and revalidation strategies to minimize database load.
- **Automated Quality Verification**:
  - **Build Integrity**: Compile and build using `pnpm run build` to catch TS and ESLint errors.
  - **Unit & Component Testing**: Execute the Vitest suite via `pnpm run test`.

---

## 🛡️ SSD Compliance Summary

| Requirement           | Status | Implementation                                   |
| :-------------------- | :----- | :----------------------------------------------- |
| Card-Based Auth       | ✅     | Web API-driven PIN verification + Admin issuance |
| Web-Based Unification | ✅     | 100% Next.js App Router consolidation            |
| Real-Time Messaging   | ✅     | Supabase Realtime 'postgres_changes'             |
| Notification Engine   | ✅     | WebPush integration                              |
| Identity Scanning     | ✅     | Web Camera Scanner + Digital ID Card loop        |
| Gamification          | ✅     | XP Engine, Levels, and Leaderboards              |

**Version 1.0 - Production Ready**
