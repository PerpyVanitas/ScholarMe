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
- **Flashcard & Quiz Generator** -- Create study sets, flashcards, multiple choice quizzes with study mode
- **Organization voting** -- Create and manage polls with multiple choice voting (Journey 6)
- **Tutor availability calendar** -- Weekly time-slot schedule management
- **Session history tracking** -- Complete session lifecycle management
- **Session ratings** -- 1-5 star ratings with feedback for completed sessions
- **Timesheet system** -- Tutor clock-in/clock-out tracking
- **Push notification infrastructure** -- Device token management for iOS/Android/Web

### Native Android App
- **Login/Register** -- Email/password authentication with role selection
- **Dashboard** -- User stats, quick actions, session overview
- **Profile Management** -- View profile, update details, change password
- **MVVM Architecture** -- ViewModel + LiveData with encrypted token storage
- **Retrofit API Client** -- Bearer token authentication with the Next.js backend

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
| Backend API  | [Spring Boot 3.x](https://spring.io/projects/spring-boot) (Java 17, JPA, JWT) |
| Web Frontend | [Next.js 16](https://nextjs.org) (App Router, React 19)         |
| Database     | [PostgreSQL 14+](https://www.postgresql.org/) via Supabase      |
| UI           | [shadcn/ui](https://ui.shadcn.com) + [Tailwind CSS v4](https://tailwindcss.com) |
| Charts       | [Recharts](https://recharts.org)                                 |
| Theming      | [next-themes](https://github.com/pacocoursey/next-themes)       |
| Icons        | [Lucide React](https://lucide.dev)                              |
| Deployment   | Railway/Heroku (Backend), Vercel (Web), APK (Mobile)            |
| Mobile (RN)  | [React Native](https://reactnative.dev) + [Expo Router](https://expo.github.io/router/) |
| Mobile (Native) | Kotlin + MVVM + Retrofit (Android)                           |
| Architecture | Vertical Slicing (feature-based modules)                         |

---

## Project Structure (Vertical Slicing Architecture)

The codebase follows **vertical slicing architecture** where features are self-contained modules with their own types, actions, components, and hooks.

```
.
├── features/                           # Vertical slices (self-contained features)
│   ├── auth/                           # Authentication feature
│   │   ├── types.ts                    # AuthCard, LoginFormData, SignUpFormData
│   │   ├── actions.ts                  # Server actions (login, signUp, signOut)
│   │   └── index.ts                    # Barrel export
│   ├── tutors/                         # Tutors feature
│   │   ├── types.ts                    # Tutor, TutorAvailability
│   │   ├── hooks/use-tutors.ts         # Custom hooks
│   │   ├── components/                 # Feature-specific components
│   │   └── index.ts
│   ├── sessions/                       # Sessions feature
│   │   ├── types.ts                    # Session, SessionRating, Timesheet
│   │   └── index.ts
│   ├── resources/                      # Resources feature
│   │   ├── types.ts                    # Repository, Resource
│   │   └── index.ts
│   ├── quizzes/                        # Quizzes/Flashcards feature
│   │   ├── types.ts                    # StudySet, StudySetItem, QuizAttempt
│   │   ├── actions.ts                  # CRUD operations
│   │   └── index.ts
│   ├── admin/                          # Admin feature
│   │   ├── types.ts                    # Poll, Notification, AnalyticsLog
│   │   └── index.ts
│   └── index.ts                        # Main features barrel export
│
├── shared/                             # Shared utilities across features
│   ├── types/index.ts                  # Common types (Profile, Role, etc.)
│   └── lib/supabase/                   # Supabase client/server utilities
│
├── app/                                # Next.js App Router (thin route layer)
│   ├── page.tsx                        # Landing page
│   ├── layout.tsx                      # Root layout
│   ├── auth/                           # Auth routes
│   ├── dashboard/                      # Dashboard routes
│   │   ├── home/                       # Dashboard home
│   │   ├── sessions/                   # Sessions management
│   │   ├── tutors/                     # Tutor browsing
│   │   ├── resources/                  # Resource repository
│   │   ├── quizzes/                    # Flashcards & quizzes
│   │   │   ├── page.tsx                # My sets / Shared sets tabs
│   │   │   └── study/[id]/page.tsx     # Study mode (flashcard/quiz)
│   │   ├── voting/                     # Organization polls
│   │   └── admin/                      # Admin-only routes
│   └── api/
│       ├── android/auth/               # Android app API endpoints
│       ├── quizzes/                    # Quiz CRUD APIs
│       └── ...                         # Other API routes
│
├── android/                            # Native Android app (Kotlin)
│   ├── app/src/main/java/com/scholarme/
│   │   ├── core/                       # Shared utilities
│   │   ��   ├── data/local/             # TokenManager (encrypted storage)
│   │   │   ├── data/model/             # API request/response models
│   │   │   ├── data/remote/            # ApiService, ApiClient
│   │   │   └── util/                   # Result wrapper
│   │   └── features/                   # Vertical slices
│   │       ├── auth/                   # Login, Register
│   │       ├── dashboard/              # Dashboard screen
│   │       └── profile/                # Profile, UpdateProfile, ChangePassword
│   └── app/src/main/res/               # XML layouts, drawables, themes
│
├── backend/                            # Spring Boot 3.x API (Java 17)
│   ├── src/main/java/com/scholarme/
│   │   ├── features/                   # Vertical slices (feature modules)
│   │   │   ├── auth/                   # AuthController, AuthService, DTOs
│   │   │   ├── admin/                  # AdminController, AdminService, AnalyticsLog
│   │   │   ├── dashboard/              # DashboardController, DashboardService
│   │   │   ├── notifications/          # NotificationController, Notification entity
│   │   │   ├── sessions/               # SessionController, Session entity, DTOs
│   │   │   ├── tutors/                 # TutorController, TutorAvailability
│   │   │   └── users/                  # UserController, UserService
│   │   └── shared/                     # Cross-cutting concerns
│   │       ├── dto/                    # ApiResponse wrapper
│   │       ├── entity/                 # User, Role, AuthCard, Tutor
│   │       ├── exception/              # GlobalExceptionHandler
│   │       ├── repository/             # UserRepository
│   │       └── security/               # JwtService, SecurityConfig
│   └── pom.xml                         # Maven configuration
│
├── mobile/                             # React Native / Expo mobile app
│
├── components/                         # Shared UI components
│   ├── ui/                             # shadcn/ui primitives
│   ├── dashboard/                      # Dashboard views
│   └── landing/                        # Landing page sections
│
├── lib/                                # Utilities (backward compatible)
│   ├── types.ts                        # Re-exports from features
│   ├── supabase/                       # Supabase clients
│   └── ...
│
├── hooks/                              # Shared hooks
├── scripts/                            # SQL migration scripts
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

## Mobile Apps

### React Native / Expo App

The `mobile/` directory contains a **React Native** app built with **Expo Router**. It mirrors the web dashboard with tab-based navigation for home, sessions, tutors, resources, and profile screens.

```bash
cd mobile
npm install
npx expo start
```

Set environment variables for Expo:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Native Android App (Kotlin)

The `android/` directory contains a complete **native Android app** built with Kotlin, following MVVM architecture and vertical slicing.

**Features:**
- Login & Registration with role selection (Learner/Tutor)
- Dashboard with stats, quick actions, and sessions list
- Profile management (view, update, change password)
- Encrypted token storage using AndroidX Security
- Retrofit API client with Bearer authentication
- Hilt dependency injection for testable, modular code
- Network error handling with retry logic and user-friendly messages

**To build the APK:**

1. Open the `android/` folder in **Android Studio**
2. Wait for Gradle sync to complete
3. Update `API_BASE_URL` in `app/build.gradle.kts` with your Vercel URL
4. Build > Build APK(s)
5. Install on device/emulator

**Project Structure:**
```
android/app/src/main/java/com/scholarme/
├── ScholarMeApplication.kt  # Hilt Application class
├── core/                    # Shared utilities
│   ├── di/                  # Hilt DI modules (NetworkModule, RepositoryModule)
│   ├── data/local/          # TokenManager (encrypted SharedPreferences)
│   ├── data/model/          # API request/response models
│   ├── data/remote/         # ApiService, ApiClient, Interceptors
│   └── util/                # Result sealed class
└── features/                # Vertical slices (MVVM)
    ├── auth/                # Login, Register (Activity + ViewModel + Repository)
    ├── dashboard/           # Dashboard with SessionsAdapter
    └── profile/             # Profile, UpdateProfile, ChangePassword
```

**Key Features:**
- Hilt dependency injection for cleaner architecture
- Network error interceptor with automatic retry (3 attempts, exponential backoff)
- Auth interceptor for automatic Bearer token attachment
- RecyclerView with DiffUtil for efficient session list updates

**API Endpoints (for Android):**
- `POST /api/android/auth/login` - Login with email/password
- `POST /api/android/auth/register` - Register new user
- `GET /api/android/auth/profile` - Get user profile
- `PUT /api/android/auth/update-profile` - Update profile
- `POST /api/android/auth/change-password` - Change password

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
| Flashcard & Quiz Generator         | Implemented  | Study sets, flashcards, quiz mode        |
| Push notification infrastructure   | Implemented  | Device tokens table, API endpoints       |
| Error codes (50+ variations)       | Implemented  | `lib/api-errors.ts`                      |
| Standardized API responses         | Implemented  | Success/error format with pagination     |
| Native Android App                 | Implemented  | Kotlin MVVM + Hilt DI + Retrofit         |
| Vertical Slicing Architecture      | Implemented  | Feature-based modules (Web, Backend, Android) |
| Error Boundaries                   | Implemented  | Global + dashboard error handling        |
| Auth Guards (Middleware)           | Implemented  | Protected routes, auth-only routes       |

**Overall Compliance: ~98%**
