# ScholarMe: System Architecture Manual

This manual explains how the ScholarMe platform is built and how its various parts connect. It is designed to be clear, structured, and easy to follow.

---

## I. The Big Picture
ScholarMe is a system that connects a high-power Web Dashboard with a portable Android Mobile App. These two "front-ends" talk to a central "Brain" (the API), which stores all the information in a secure "Memory" (the Database).

### The Three Main Parts:
1. **The Web Dashboard**: Where admins and tutors manage schedules and users.
2. **The Android App**: Used for scanning IDs, checking in, and student access on the go.
3. **The Central Engine**: A secure cloud system (Supabase) that handles data, logins, and file storage.

---

## II. How the System Connects
(Imagine a simple drawing here: The Web and Phone both connect to a central Cloud icon, which then branches out into Data, Security, and Files.)

1. **Web & Phone** -> They send requests to the **API Layer**.
2. **API Layer** -> It checks if the user is allowed to see the data.
3. **Cloud Engine** -> It updates the **Database** and sends instant alerts back to everyone.

---

## III. The Building Blocks

### 1. The Web Platform
*   **Built With**: Next.js and React.
*   **Purpose**: To provide a large, interactive interface for complex tasks.
*   **Design**: Uses a "Modern Clean" look with responsive layouts that work on any screen size.

### 2. The Android Platform
*   **Built With**: Kotlin and Jetpack Compose.
*   **Purpose**: To handle physical tasks like QR code scanning and offline viewing.
*   **Feature**: It saves a copy of important data on the phone so it works even without an internet connection.

### 3. The API & Security Layer
*   **The Gatekeeper**: This is a set of rules that ensures only the right people see the right data.
*   **Standard Language**: Every message between the apps and the server follows a strict "Form" so there are no misunderstandings.

### 4. The Data Storage (Supabase)
*   **Live Updates**: When something changes (like a new message), the system updates everyone's screen instantly without them having to refresh.
*   **Safety**: Every row of data is protected by "Row-Level Security," acting like a lock on every single file.

---

## IV. Core Features explained

### 1. Identity & Logins
We use a "Dual-Identity" system. You can log in with an email and password on your computer, or use a Digital ID Card and a 4-digit PIN at a physical kiosk.

### 2. Gamification (XP & Levels)
The system tracks "Experience Points" (XP). Users earn points by completing sessions or contributing resources. As they earn points, they level up and move up on the global Leaderboard.

### 3. Messaging & Alerts
Messaging happens in real-time. Whether you are on your phone or your laptop, your chats and notifications stay in perfect sync.

### 4. Resource Repository
A library of academic materials (PDFs, videos, etc.). The system can even automatically create quizzes and flashcards from the study sets you upload.

---

## V. Technical Glossary (The "Cheat Sheet")

*   **BaaS**: "Backend-as-a-Service." Using a pre-built cloud engine (Supabase) to save time and increase security.
*   **JWT**: A digital "Identity Pass" that the phone or computer shows to the server.
*   **RBAC**: "Role-Based Access Control." Rules that say what a "Student" can see versus an "Admin."
*   **Offline Cache**: A small storage area on the phone to keep things working without Wi-Fi.

---

**Manual Version**: 1.2  
**Format**: Transcription Ready  
**Date**: May 11, 2026
