# ScholarMe

A full-stack tutoring platform built with **Next.js 16**, **Supabase**, and **shadcn/ui**. ScholarMe connects learners with tutors through session booking, resource sharing, and role-based dashboards. It also includes an optional **React Native (Expo)** mobile client under the `mobile/` directory.

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
- [Demo Mode](#demo-mode)
- [Mobile App](#mobile-app)
- [Deployment](#deployment)

---

## Features

- **Role-based dashboards** -- distinct views for learners, tutors, and administrators
- **Session booking** -- learners browse tutors, book sessions, and leave 1-5 star ratings
- **Session lifecycle** -- pending, confirmed, completed, cancelled with tutor confirmation flow
- **Tutor availability** -- tutors manage weekly time-slot schedules
- **Resource repositories** -- tutors and admins share study materials (PDFs, videos, links)
- **Card-based login** -- alternative authentication via Card ID + PIN for lab/kiosk environments
- **Admin tools** -- user management, card issuance, session oversight, and org-wide analytics
- **Notifications** -- in-app notification center with unread count badges
- **Dark/light mode** -- theme toggle with system preference detection via `next-themes`
- **Responsive design** -- mobile-first layout with collapsible sidebar navigation
- **Demo mode** -- explore all three roles without authentication using seeded data

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
│   ├── auth/
│   │   ├── actions.ts                  # Server actions: signIn, signUp, signOut
│   │   ├── login/page.tsx              # Email/password + Card login
│   │   └── sign-up/page.tsx            # Registration with role picker
│   ├── dashboard/
│   │   ├── layout.tsx                  # Sidebar + header + auth resolution
│   │   ├── page.tsx                    # Role-routed dashboard (server component)
│   │   ├── actions.ts                  # switchDevRole server action
│   │   ├── sessions/page.tsx           # View/manage sessions (learner + tutor)
│   │   ├── tutors/page.tsx             # Browse and search tutors
│   │   ├── tutors/[id]/page.tsx        # Tutor detail + booking form
│   │   ├── availability/page.tsx       # Tutor schedule management
│   │   ├── resources/page.tsx          # Repository browser + resource sharing
│   │   ├── notifications/page.tsx      # Notification center
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
│       ├── auth/card-login/route.ts    # POST: Card ID + PIN auth
│       └── admin/
│           ├── users/route.ts          # POST: create user (admin)
│           └── cards/route.ts          # POST/PUT: issue/revoke cards
├── components/
│   ├── app-sidebar.tsx                 # Role-aware navigation sidebar
│   ├── dev-role-switcher.tsx           # Demo mode role toggle banner
│   ├── theme-toggle.tsx                # Light/dark mode switch
│   ├── theme-provider.tsx              # next-themes wrapper
│   ├── dashboard/
│   │   ├── admin-dashboard.tsx         # Admin dashboard view
│   │   ├── learner-dashboard.tsx       # Learner dashboard view
│   │   └── tutor-dashboard.tsx         # Tutor dashboard view
│   ├── landing/                        # Landing page sections
│   └── ui/                             # shadcn/ui primitives
├── lib/
│   ├── types.ts                        # TypeScript interfaces (mirror DB tables)
│   ├── constants.ts                    # Shared UI constants (status colors, etc.)
│   ├── demo.ts                         # Demo mode user ID mappings
│   ├── utils.ts                        # cn() classname utility
│   └── supabase/
│       ├── client.ts                   # Browser Supabase client
│       ├── server.ts                   # Server client + admin client
│       └── middleware.ts               # Session refresh middleware
├── scripts/                            # SQL migration scripts (run in order)
├── mobile/                             # React Native / Expo mobile app
├── middleware.ts                        # Next.js middleware (session refresh)
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
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/dashboard
```

The `SUPABASE_SERVICE_ROLE_KEY` is required for admin operations (creating users, card authentication, card management). You can find it in your Supabase project under **Settings > API**.

### Database Setup

Run the SQL migration scripts in order against your Supabase project. You can execute them via the **Supabase SQL Editor** or any PostgreSQL client:

```
scripts/001_roles_and_profiles.sql      # Roles table, profiles table, auth trigger
scripts/001a_create_roles.sql           # Seed learner/tutor/administrator roles
scripts/002_auth_cards.sql              # Auth cards table + RLS
scripts/003_tutors_and_specializations.sql  # Tutors, specializations, availability
scripts/004_sessions.sql                # Sessions + ratings tables
scripts/005_repositories.sql            # Resource repositories + resources
scripts/006_notifications.sql           # Notifications table
scripts/007_analytics_logs.sql          # Analytics logging table
scripts/010_auto_create_tutor_on_signup.sql  # Auto-create tutor record on signup
```

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

ScholarMe supports two authentication methods:

### Email + Password
Standard Supabase Auth flow. Users sign up with an email, password, and role selection (learner or tutor). A confirmation email is sent before the account is activated.

### Card ID + PIN
An alternative login method for environments like school labs or kiosks. Administrators issue cards from the admin dashboard, and users authenticate by entering their Card ID and PIN. This uses the Supabase Admin API to generate a magic-link session on the server.

---

## User Roles

| Role          | Capabilities                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------ |
| **Learner**   | Browse tutors, book sessions, cancel bookings, rate completed sessions, view resources            |
| **Tutor**     | All learner capabilities + manage availability, confirm/complete sessions, create repositories and upload resources |
| **Administrator** | All tutor capabilities + create/manage users, issue/revoke auth cards, view all sessions, access analytics |

Roles are assigned at registration. The `administrator` role can only be granted by another admin through the user management page.

---

## Database Schema

The database consists of the following tables:

| Table                  | Purpose                                    |
| ---------------------- | ------------------------------------------ |
| `roles`                | Role definitions (learner, tutor, administrator) |
| `profiles`             | User profiles linked to Supabase Auth      |
| `auth_cards`           | Card-based authentication credentials      |
| `tutors`               | Tutor-specific data (bio, rating)          |
| `specializations`      | Subject areas tutors can teach             |
| `tutor_specializations`| Many-to-many link between tutors and subjects |
| `tutor_availability`   | Weekly time slots for each tutor           |
| `sessions`             | Tutoring session bookings                  |
| `session_ratings`      | Learner ratings and feedback for sessions  |
| `repositories`         | Resource folders with access-level control |
| `resources`            | Study material links within repositories   |
| `notifications`        | In-app notifications per user              |
| `analytics_logs`       | Event logging for admin analytics          |

Row Level Security (RLS) is enabled on all tables. Public read policies exist for profiles, tutors, specializations, sessions, notifications, repositories, and resources. Write operations are restricted to authenticated users with appropriate roles.

---

## API Routes

| Method | Route                                | Description                      |
| ------ | ------------------------------------ | -------------------------------- |
| GET    | `/api/tutors`                        | List all tutors with profiles    |
| POST   | `/api/sessions`                      | Book a new session               |
| PUT    | `/api/sessions/[id]/status`          | Update session status            |
| POST   | `/api/sessions/[id]/rate`            | Rate a completed session         |
| GET    | `/api/repositories`                  | List all repositories            |
| POST   | `/api/repositories`                  | Create a new repository          |
| POST   | `/api/repositories/[id]/resources`   | Add a resource to a repository   |
| POST   | `/api/auth/card-login`               | Authenticate via Card ID + PIN   |
| POST   | `/api/admin/users`                   | Create a new user (admin only)   |
| POST   | `/api/admin/cards`                   | Issue an auth card (admin only)  |
| PUT    | `/api/admin/cards`                   | Activate/revoke a card (admin)   |

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
