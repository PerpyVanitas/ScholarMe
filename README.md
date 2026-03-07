# ScholarMe

A full-stack tutoring management platform built with **Next.js 16**, **Supabase**, and **shadcn/ui**. ScholarMe connects learners with tutors through session booking, resource sharing, organization voting, and role-based dashboards. It also includes an optional **React Native (Expo)** mobile client under the `mobile/` directory.

**SSD Compliance:** ~95% - All MUST-HAVE features implemented per System Design Document.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Database Setup](#database-setup)
  - [Running the App](#running-the-app)
- [Authentication](#authentication)
- [User Roles](#user-roles)
- [Database Schema](#database-schema)
- [API Routes](#api-routes)
- [Error Handling](#error-handling)
- [Demo Mode](#demo-mode)
- [Mobile App](#mobile-app)
- [Deployment](#deployment)

---

## Features

### Core Features (SSD MUST-HAVE)
- **Card-based authentication** -- Card ID + PIN login for lab/kiosk environments
- **User and role management** -- Admin controls for user creation, role assignment, and card issuance
- **Tutor scheduling system** -- Learners browse tutors, book sessions, and manage bookings
- **Resource repository** -- Tutors and admins share study materials (PDFs, videos, links)
- **In-app notifications** -- Notification center with unread count badges
- **Administrative dashboard** -- User management, session oversight, and org-wide analytics

### Extended Features (SSD SHOULD/COULD-HAVE)
- **Organization voting** -- Create and manage polls with multiple choice voting (Journey 6)
- **Tutor availability calendar** -- Weekly time-slot schedule management
- **Session history tracking** -- Complete session lifecycle management
- **Session ratings** -- 1-5 star ratings with feedback for completed sessions
- **Timesheet system** -- Tutor clock-in/clock-out tracking
- **Push notification infrastructure** -- Device token management for iOS/Android/Web

### Platform Features
- **Role-based dashboards** -- Distinct views for learners, tutors, and administrators
- **Dark/light mode** -- Theme toggle with system preference detection via `next-themes`
- **Responsive design** -- Mobile-first layout with collapsible sidebar navigation
- **Demo mode** -- Explore all three roles without authentication using seeded data
- **Inactivity timeout** -- Automatic session logout after 10 minutes of inactivity

---

## Tech Stack

| Layer        | Technology                                                       |
| ------------ | ---------------------------------------------------------------- |
| Framework    | [Next.js 16](https://nextjs.org) (App Router, React 19)         |
| Database     | [Supabase](https://supabase.com) (PostgreSQL + Auth + RLS)      |
| UI           | [shadcn/ui](https://ui.shadcn.com) + [Tailwind CSS v4](https://tailwindcss.com) |
| Charts       | [Recharts](https://recharts.org)                                 |
| Theming      | [next-themes](https://github.com/pacocoursey/next-themes)       |
| Icons        | [Lucide React](https://lucide.dev)                              |
| Deployment   | [Vercel](https://vercel.com)                                    |
| Mobile       | [React Native](https://reactnative.dev) + [Expo Router](https://expo.github.io/router/) |

---

## Project Structure

```
.
├── app/
│   ├── page.tsx                        # Landing page
│   ├── layout.tsx                      # Root layout (fonts, theme provider)
│   ├── globals.css                     # ScholarMe color scheme + Tailwind v4
│   ├── auth/
│   │   ├── actions.ts                  # Server actions: signIn, signUp, signOut
│   │   ├── login/page.tsx              # Email/password + Card login
│   │   ├── sign-up/page.tsx            # Registration with role picker
│   │   └── setup-profile/page.tsx      # Profile completion after signup
│   ├── panel/                          # Main authenticated dashboard
│   │   ├── layout.tsx                  # Sidebar + header + UserProvider
│   │   ├── page.tsx                    # Role-routed dashboard
│   │   ├── home/page.tsx               # Dashboard home
│   │   ├── sessions/page.tsx           # View/manage sessions
│   │   ├── tutors/page.tsx             # Browse and search tutors
│   │   ├── tutors/[id]/page.tsx        # Tutor detail + booking form
│   │   ├── availability/page.tsx       # Tutor schedule management
│   │   ├── resources/page.tsx          # Repository browser
│   │   ├── voting/page.tsx             # Organization polls (Journey 6)
│   │   ├── notifications/page.tsx      # Notification center
│   │   ├── timesheet/page.tsx          # Tutor clock-in/out
│   │   ├── profile/page.tsx            # View/edit profile
│   │   └── admin/
│   │       ├── users/page.tsx          # User management
│   │       ├── cards/page.tsx          # Auth card issuance
│   │       ├── sessions/page.tsx       # All sessions overview
│   │       └── analytics/page.tsx      # Org-wide charts and stats
│   └── api/
│       ├── tutors/route.ts             # GET: list tutors
│       ├── sessions/route.ts           # POST: book session
│       ├── sessions/[id]/status/       # PUT: confirm/complete/cancel
│       ├── sessions/[id]/rate/         # POST: rate a session
│       ├── repositories/route.ts       # GET/POST: list/create repos
│       ├── repositories/[id]/resources # POST: add resource to repo
│       ├── polls/route.ts              # GET/POST: list/create polls
│       ├── polls/[id]/vote/route.ts    # POST: cast vote
│       ├── polls/[id]/results/route.ts # GET: poll results
│       ├── users/device-token/route.ts # POST/DELETE: push notification tokens
│       ├── dashboard/route.ts          # GET: dashboard data
│       ├── auth/
│       │   ├── card-login/route.ts     # POST: Card ID + PIN auth
│       │   └── register-card/route.ts  # POST: Issue card (admin)
│       └── admin/
│           ├── users/route.ts          # POST: create user (admin)
│           └── cards/route.ts          # POST/PUT: issue/revoke cards
├── components/
│   ├── app-sidebar.tsx                 # Role-aware navigation sidebar
│   ├── dev-role-switcher.tsx           # Demo mode role toggle banner
│   ├── theme-toggle.tsx                # Light/dark mode switch
│   ├── theme-provider.tsx              # next-themes wrapper
│   ├── error-alert.tsx                 # Standardized error display
│   ├── dashboard/
│   │   ├── dashboard-view.tsx          # Role-routed dashboard view
│   │   ├── admin-dashboard.tsx         # Admin dashboard view
│   │   ├── learner-dashboard.tsx       # Learner dashboard view
│   │   └── tutor-dashboard.tsx         # Tutor dashboard view
│   ├── landing/                        # Landing page sections
│   └── ui/                             # shadcn/ui primitives
├── lib/
│   ├── types.ts                        # TypeScript interfaces (mirror DB tables)
│   ├── constants.ts                    # Shared UI constants (status colors, etc.)
│   ├── error-codes.ts                  # SSD-compliant error codes (50+ codes)
│   ├── user-context.tsx                # Centralized user/profile state
│   ├── demo.ts                         # Demo mode user ID mappings
│   ├── utils.ts                        # cn() classname utility
│   ├── api/
│   │   └── pagination.ts               # Standardized pagination helpers
│   └── supabase/
│       ├── client.ts                   # Browser Supabase client
│       ├── server.ts                   # Server client + admin client
│       ├── create-client.ts            # Shared client factory
│       └── middleware.ts               # Session refresh middleware
├── hooks/
│   ├── use-inactivity-timeout.ts       # Auto-logout after inactivity
│   └── use-mobile.tsx                  # Mobile detection hook
├── scripts/                            # SQL migration scripts (run in order)
├── mobile/                             # React Native / Expo mobile app
├── middleware.ts                       # Next.js middleware (session refresh)
└── package.json
```

---

## Getting Started

### Prerequisites

- **Node.js** 18.17 or later
- **pnpm**, **npm**, or **yarn**
- A **Supabase** project (free tier works)

### Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/panel
```

The `SUPABASE_SERVICE_ROLE_KEY` is required for admin operations (creating users, card authentication, card management). You can find it in your Supabase project under **Settings > API**.

### Database Setup

Run the SQL migration scripts in order against your Supabase project. You can execute them via the **Supabase SQL Editor** or any PostgreSQL client:

```
scripts/001_roles_and_profiles.sql          # Roles table, profiles table, auth trigger
scripts/001a_create_roles.sql               # Seed learner/tutor/admin roles
scripts/002_auth_cards.sql                  # Auth cards table + RLS
scripts/003_tutors_and_specializations.sql  # Tutors, specializations, availability
scripts/004_sessions.sql                    # Sessions + ratings tables
scripts/005_repositories.sql                # Resource repositories + resources
scripts/006_notifications.sql               # Notifications table
scripts/007_analytics_logs.sql              # Analytics logging table
scripts/008_timesheets.sql                  # Tutor timesheet clock-in/out
scripts/009-create-voting-system.sql        # Polls, poll_options, user_votes
scripts/010_auto_create_tutor_on_signup.sql # Auto-create tutor record on signup
```

**Note:** Device tokens table is created via Supabase migration for push notification support.

### Running the App

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

---

## Authentication

ScholarMe supports two authentication methods as specified in the SSD:

### Email + Password
Standard Supabase Auth flow. Users sign up with an email, password, and role selection (learner or tutor). A confirmation email is sent before the account is activated.

### Card ID + PIN (SSD Requirement)
An alternative login method for environments like school labs or kiosks. Administrators issue cards from the admin dashboard, and users authenticate by entering their Card ID and PIN. This uses the Supabase Admin API to generate a session on the server.

**Related Endpoints:**
- `POST /api/auth/card-login` -- Authenticate with Card ID + PIN
- `POST /api/auth/register-card` -- Issue new card (admin only)

---

## User Roles

| Role          | Capabilities                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------ |
| **Learner**   | Browse tutors, book sessions, cancel bookings, rate completed sessions, view resources, vote in polls |
| **Tutor**     | All learner capabilities + manage availability, confirm/complete sessions, create repositories, upload resources, clock in/out |
| **Admin**     | All tutor capabilities + create/manage users, issue/revoke auth cards, view all sessions, access analytics, create polls |

Roles are assigned at registration. The `admin` role can only be granted by another admin through the user management page.

---

## Database Schema

The database consists of the following tables (SSD-compliant):

| Table                  | Purpose                                    | SSD Section |
| ---------------------- | ------------------------------------------ | ----------- |
| `roles`                | Role definitions (learner, tutor, admin)   | 6.1         |
| `profiles`             | User profiles linked to Supabase Auth      | 6.1         |
| `auth_cards`           | Card-based authentication credentials      | 6.2         |
| `tutors`               | Tutor-specific data (bio, rating)          | 6.3         |
| `specializations`      | Subject areas tutors can teach             | 6.3         |
| `tutor_specializations`| Many-to-many link between tutors and subjects | 6.3      |
| `tutor_availability`   | Weekly time slots for each tutor           | 6.3         |
| `sessions`             | Tutoring session bookings                  | 6.4         |
| `session_ratings`      | Learner ratings and feedback for sessions  | 6.4         |
| `repositories`         | Resource folders with access-level control | 6.5         |
| `resources`            | Study material links within repositories   | 6.5         |
| `notifications`        | In-app notifications per user              | 6.6         |
| `analytics_logs`       | Event logging for admin analytics          | 6.7         |
| `timesheets`           | Tutor clock-in/clock-out records           | Extended    |
| `polls`                | Organization voting polls                  | Journey 6   |
| `poll_options`         | Options for each poll                      | Journey 6   |
| `user_votes`           | User vote records                          | Journey 6   |
| `device_tokens`        | Push notification device tokens            | 5.2         |

Row Level Security (RLS) is enabled on all tables. Public read policies exist for profiles, tutors, specializations, sessions, notifications, repositories, and resources. Write operations are restricted to authenticated users with appropriate roles.

---

## API Routes

All API routes follow the SSD response format with standardized error codes and pagination support.

### Authentication

| Method | Route                          | Description                      |
| ------ | ------------------------------ | -------------------------------- |
| POST   | `/api/auth/card-login`         | Authenticate via Card ID + PIN   |
| POST   | `/api/auth/register-card`      | Issue a new auth card (admin)    |

### Tutors & Sessions

| Method | Route                          | Description                      |
| ------ | ------------------------------ | -------------------------------- |
| GET    | `/api/tutors`                  | List all tutors with profiles    |
| POST   | `/api/sessions`                | Book a new session               |
| PUT    | `/api/sessions/[id]/status`    | Update session status            |
| POST   | `/api/sessions/[id]/rate`      | Rate a completed session         |

### Repositories & Resources

| Method | Route                                | Description                      |
| ------ | ------------------------------------ | -------------------------------- |
| GET    | `/api/repositories`                  | List all repositories            |
| POST   | `/api/repositories`                  | Create a new repository          |
| POST   | `/api/repositories/[id]/resources`   | Add a resource to a repository   |

### Voting (Journey 6)

| Method | Route                          | Description                      |
| ------ | ------------------------------ | -------------------------------- |
| GET    | `/api/polls?page=1&limit=20`   | List active polls (paginated)    |
| POST   | `/api/polls`                   | Create a new poll (admin)        |
| POST   | `/api/polls/[id]/vote`         | Cast a vote                      |
| GET    | `/api/polls/[id]/results`      | Get poll results                 |

### Push Notifications

| Method | Route                          | Description                      |
| ------ | ------------------------------ | -------------------------------- |
| POST   | `/api/users/device-token`      | Register device token            |
| DELETE | `/api/users/device-token`      | Remove device token              |

### Admin Operations

| Method | Route                          | Description                      |
| ------ | ------------------------------ | -------------------------------- |
| POST   | `/api/admin/users`             | Create a new user (admin only)   |
| POST   | `/api/admin/cards`             | Issue an auth card (admin only)  |
| PUT    | `/api/admin/cards`             | Activate/revoke a card (admin)   |

---

## Error Handling

ScholarMe implements comprehensive error handling per SSD Section 5.3 with 50+ error code variations:

### Error Code Categories

| Code Prefix | Category              | Example                                    |
| ----------- | --------------------- | ------------------------------------------ |
| AUTH-001    | Invalid credentials   | Wrong email/password, account locked       |
| AUTH-002    | Token expired         | Session expired, invalid token             |
| AUTH-003    | Access denied         | Insufficient permissions, admin required   |
| VALID-001   | Validation failed     | Email exists, password weak, missing field |
| DB-001      | Resource not found    | User not found, profile missing            |
| BUS-001     | Scheduling conflict   | Slot unavailable, booking in past          |
| BUS-002     | Card/scan failure     | Card expired, scan failed                  |
| SYSTEM-001  | System error          | Database error, rate limited, timeout      |

### Response Format

All API responses follow this structure:

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

Error responses:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "AUTH-001",
    "message": "Invalid credentials",
    "details": "Email or password is incorrect."
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Pagination Format

Paginated endpoints return:

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Demo Mode

When no user is authenticated, the app enters **demo mode**. A banner appears at the top of the dashboard with role-switching buttons (Learner / Tutor / Admin). This uses a `dev_role` cookie and pre-seeded database records to display realistic data for each role without requiring sign-up.

Demo mode is intended for development and preview purposes. In production, remove or gate the `DevRoleSwitcher` component behind an environment flag.

---

## Mobile App

The `mobile/` directory contains a **React Native** app built with **Expo Router**. It mirrors the web dashboard with tab-based navigation for home, sessions, tutors, resources, and profile screens.

To run the mobile app:

```bash
cd mobile
npm install
npx expo start
```

The mobile app uses the same Supabase backend. Set the following environment variables for Expo:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## Deployment

The app is optimized for deployment on **Vercel**:

1. Push the repository to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add the Supabase integration (or set environment variables manually)
4. Deploy

Ensure the Supabase project's **Site URL** and **Redirect URLs** are configured to match your Vercel deployment domain under **Authentication > URL Configuration** in the Supabase dashboard.

---

## SSD Compliance Summary

| SSD Requirement                    | Status       | Implementation                           |
| ---------------------------------- | ------------ | ---------------------------------------- |
| Card-based authentication          | Implemented  | `/api/auth/card-login`, `/api/auth/register-card` |
| User and role management           | Implemented  | Admin dashboard, RLS policies            |
| Tutor scheduling system            | Implemented  | Sessions, availability, booking flow     |
| Resource repository                | Implemented  | Repositories, resources with access control |
| In-app notifications               | Implemented  | Notifications table, notification center |
| Administrative dashboard           | Implemented  | Analytics, user management, card issuance |
| Tutor availability calendar        | Implemented  | Weekly time slot management              |
| Session history tracking           | Implemented  | Session lifecycle management             |
| Organization voting (Journey 6)    | Implemented  | Polls, poll_options, user_votes          |
| Push notification infrastructure   | Implemented  | Device tokens table, API endpoints       |
| Error codes (50+ variations)       | Implemented  | `lib/error-codes.ts`                     |
| Standardized API responses         | Implemented  | Success/error format with pagination     |

**Overall Compliance: ~95%**
