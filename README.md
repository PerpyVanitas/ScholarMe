# ScholarMe

A high-performance academic management ecosystem built with **Next.js**, **Supabase**, and **Native Android (Jetpack Compose)**. ScholarMe bridges the gap between digital management and physical tutoring through real-time engagement, gamified learning, and secure identity verification.

**SSD Compliance:** 100% - All MUST-HAVE, SHOULD-HAVE, and COULD-HAVE features implemented per System Design Document.

---

## 📖 Table of Contents

- [Features](#features)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Authentication & Identity](#authentication--identity)
- [Gamification Engine](#gamification-engine)
- [User Roles](#user-roles)
- [Database Schema](#database-schema)
- [API Contract](#api-contract)
- [Error Handling](#error-handling)
- [Mobile Apps](#mobile-apps)
- [Deployment](#deployment)

---

## ✨ Features

### 🏛️ Core Platform (SSD MUST-HAVE)
- **Multi-Modal Authentication**: Card ID + PIN (Kiosk) and Email/Password (Personal).
- **User & Role Management**: RBAC for Learners, Tutors, and Administrators.
- **Tutor Scheduling**: Real-time availability management and session booking.
- **Resource Repository**: Secure knowledge sharing with role-based access control.
- **In-App Notifications**: Real-time activity feeds with unread badge tracking.
- **Admin Command Center**: Centralized oversight for users, sessions, and system analytics.

### 🎮 Engagement & Growth (SSD SHOULD/COULD-HAVE)
- **Gamification Engine**: XP-based progression, leveling system, and global leaderboards.
- **Real-Time Messaging**: WebSocket-driven chat with instant cross-platform sync.
- **Organization Voting**: Transparent poll management for organizational decisions.
- **Study & Quiz Suite**: Automated flashcard and quiz generation from study sets.
- **Push Notification Engine**: Multi-platform alerts (FCM for Android, VAPID for Web).
- **Identity Scanner**: Admin tool for instant student verification via QR ID cards.

### 📱 Native Android Experience
- **Single-Activity Compose**: 100% modern UI built with Jetpack Compose.
- **Digital ID Card**: High-contrast, brand-aligned identity cards with dynamic QR generation.
- **Offline Persistence**: Room DB support for resource viewing and session history.
- **Hilt DI**: Clean, testable architecture with enterprise-grade dependency injection.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Backend / API** | [Next.js API Routes](https://nextjs.org) (Serverless, TypeScript) |
| **BaaS / Database** | [Supabase](https://supabase.com) (PostgreSQL, Auth, Realtime, Storage) |
| **Web Frontend** | [Next.js](https://nextjs.org) (React 19, App Router, Tailwind CSS v4) |
| **Android Mobile** | [Kotlin](https://kotlinlang.org) + [Jetpack Compose](https://developer.android.com/compose) |
| **Real-Time** | [Supabase Realtime](https://supabase.com/realtime) (PostgreSQL Changes, Broadcast) |
| **Push Alerts** | [Firebase Cloud Messaging (FCM)](https://firebase.google.com/docs/cloud-messaging) |
| **Styling** | [shadcn/ui](https://ui.shadcn.com) + [Lucide Icons](https://lucide.dev) |

---

## 📁 Project Structure

```
.
├── android/                # Native Android App (Jetpack Compose, Hilt, MVVM)
│   ├── app/src/main/java/  # Feature-based Kotlin modules
│   └── app/src/main/res/   # Modern vector resources (XML layouts deprecated)
├── app/                    # Next.js App Router (Unified Web & API Layer)
│   ├── api/                # RESTful endpoints for Web and Mobile
│   ├── dashboard/          # Role-specific UI slices
│   └── (auth)/             # Authentication routes
├── components/             # Reusable UI components (shadcn/ui, Framer Motion)
├── features/               # Cross-cutting business logic (Auth, Sessions, XP)
├── lib/                    # Shared utilities (Supabase Client, Push Service)
├── scripts/                # SQL Migration scripts (001 - 003+)
└── supabase/               # Edge Functions and Database Config
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Android Studio Ladybug+
- Supabase Project

### Quick Setup
1. **Clone & Install**:
   ```bash
   git clone https://github.com/your-org/scholarme.git
   npm install
   ```
2. **Environment**:
   Copy `.env.example` to `.env.local` and add your Supabase credentials.
3. **Database**:
   Run the scripts in `scripts/` sequentially in your Supabase SQL Editor.
4. **Launch**:
   ```bash
   npm run dev      # Launch Web Dashboard
   ```

---

## 🆔 Authentication & Identity

ScholarMe implements a **Dual-Identity System**:
1. **Digital Persona**: Email-based accounts for personal device access.
2. **Physical Identity**: Card-based login (ID + PIN) for institutional kiosks.
3. **QR Verification**: Every user has a unique **Digital ID Card**. Admins use the **Identity Scanner** (Android) to verify status, XP, and active sessions instantly.

---

## 🏆 Gamification Engine

The system uses a **Reactive XP Logic** to drive engagement:
- **Earn XP**: Awarded for session completion, quiz scores, and resource contributions.
- **Level Up**: Automatic level progression based on XP thresholds.
- **Leaderboards**: Real-time ranking of top students and tutors across the organization.

---

## 📊 Error Handling & API Contract

ScholarMe adheres to the **SSD Standard Response Format**:

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
*Over 50 unique error codes are handled with localized messages and automated retry logic on Mobile.*

---

## 📱 Mobile Apps

### Native Android (Primary)
Our flagship mobile client provides the full ScholarMe experience with an emphasis on **Performance and Offline Health**.
- **Build**: Open `android/` in Android Studio and build the `debug` or `release` APK.
- **Stack**: Kotlin, Compose, Hilt, Retrofit, Room, CameraX (Scanner).

### React Native / Expo (Legacy)
Located in `mobile/`, this client is maintained for cross-platform prototyping.

---

## 🛡️ SSD Compliance Summary

| Requirement | Status | Implementation |
| :--- | :--- | :--- |
| Card-Based Auth | ✅ | API-driven PIN verification + Admin issuance |
| Single-Activity Android | ✅ | 100% Jetpack Compose unification |
| Real-Time Messaging | ✅ | Supabase Realtime 'postgres_changes' |
| Notification Engine | ✅ | Multi-platform FCM/WebPush integration |
| Identity Scanning | ✅ | Admin Scanner + Digital ID Card loop |
| Gamification | ✅ | XP Engine, Levels, and Leaderboards |

**Version 1.0 - Production Ready**
