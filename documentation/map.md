# ScholarMe — User Interaction & Feature Map

> This document tracks all verified features and user interactions across the ScholarMe platform.  
> It must be reviewed at the end of every development cycle to ensure no features have been orphaned or broken by new updates.  
> Last updated: 2026-07-13

---

## Feature Domains Overview

ScholarMe is divided into several primary domains, each governed by the access controls defined in the [RBAC Reference](./rbac.md).

| Domain | Scope | Primary Users |
|--------|-------|---------------|
| **Auth & Onboarding** | Account creation, mandatory profile setup | All users |
| **Study Tools** | Local AI quizzes, spaced repetition flashcards | Learners, Tutors |
| **Tutoring & Sessions** | Peer Learning Center booking engine | Learners, Tutors, Admins |
| **Library & Resources** | Digital file sharing and CFMR physical inventory | All users |
| **Community** | Forums, DMs, Study Groups | Honor Society Members |
| **Finance** | Executive budget tracking and liquidations | Executives, Admins |
| **IT Administration** | Role management, logs, system integrations | Super Admin, Administrators |

---

## 🚪 Auth and Onboarding

- **Sign up / Login**: Users can authenticate via Email/Password or OAuth providers.
- **Onboarding Flow**: First-time login forces users into a multi-step onboarding wizard.
  - Accept Terms and Conditions.
  - Complete profile details (Full Name, Avatar).
  - Enter academic details (`degree_program`, `year_level`).
  - **Lockout**: Users cannot bypass onboarding. The dashboard routes continuously redirect back to setup if `profile_completed` is false.

---

## 🧠 Study and Learning Tools (AI Powered)

- **Quizzes and Flashcards Module**:
  - **Create Study Sets**: Users can create study sets manually, or generate them using AI by uploading a PDF resource.
  - **AI Generation**: Powered completely free by Local AI (`WebWorkerMLCEngine`) running in the browser. Server-side Gemini API acts as a rate-limited fallback (2 requests/min) for large document extraction.
  - **Image Occlusion**: Users can attach an image to a flashcard and draw interactive occlusion masks (rectangles) over it. During study mode, clicking the mask reveals the hidden part.
- **Study Modes**:
  - **Spaced Repetition (SRS)**: Replaces standard self-grading. Users rate their confidence (Again/Hard/Good/Easy), powering the SM2 algorithm.
  - **Typing Mode**: Forces learners to type the exact answer.
  - **TTS**: Native browser Text-to-Speech reads questions and answers.
- **Exporting**: Users can export any study set to an Anki/Quizlet compatible CSV format.
- **AI Tutor (WebLLM)**: An omnipresent chat interface where users can ask academic questions to a locally running AI model.

---

## 📅 Tutoring and Sessions

- **Find a Tutor**: Learners browse the active roster of tutors. 
  - `super_admin`, `administrator`, and `learner` accounts are excluded from search results.
  - All Honor Society members must have a Tutor Account and can act as both learners (receiving tutoring) and tutors (providing tutoring).
- **Booking Flow**:
  - **1-on-1 Sessions**: Learner selects a subject, picks an available timeslot from the tutor's schedule, and adds prep notes.
  - **Group Sessions**: Learner can specify `max_participants` (up to 5).
  - **Recurring**: Tutors can accept 4-week recurring session blocks.
- **Waitlists and Open Groups**:
  - Learners can browse "Open Groups" and join them.
  - If a group is full, learners can join a Waitlist. Auto-promotion occurs upon cancellation.
- **Session Management (Tutor)**:
  - **Substitute**: A tutor can send a transfer request to another tutor if they cannot make a confirmed session.
  - **Reschedule**: Propose a new time to the learner instead of forcing a change.
- **Peer Reviews**: Lead Tutors and Committee Heads can write 1-5 star evaluations for junior tutors. Regular tutors can only read their own reviews.

---

## 📚 Library and Resources

- **Digital Resources**:
  - Upload PDFs, Images, Docs.
  - **Visibility**: Toggle `is_public` to lock resources to authenticated org members only.
  - **Preview**: In-browser object preview (PDFs) with fallback download links.
- **Physical Library (CFMR Only)**:
  - **Catalog**: Inventory of actual books.
  - **Barcode Scanner**: Scan ISBNs via webcam using `html5-qrcode` to find or add books.
  - **Checkout Flow**: Admins check out books to learners, setting a due date.
- **Interactive Campus Map**: Visual modal to guide users to physical resources and the tutoring center.

---

## 👥 Community and Networking

- **Study Groups**: Users can create public or private study groups. Includes a Supabase Realtime chat interface.
- **Forums (Discussions)**: Organization-wide discussion boards. Users can post, reply, and upvote.
- **Direct Messaging**: 1-on-1 chats with read receipts, pinned messages, threaded replies, and file attachments.
- **Networking Algorithms**:
  - **Study Buddies**: Algorithmic matching of peers in the same degree program and year.
  - **Alumni Directory**: Connect with graduated students.
- **Live Support Chat**: Floating widget connecting users directly to a Super Admin for immediate help.

---

## 💰 Finance Module

> [!CAUTION]
> **Executive Lock**: Final approval on large requests is restricted exclusively to the `president`. Admins cannot override financial approvals.

- **Workflows**:
  - **Budget Requests**: Save as draft, submit, multi-step approval.
  - **Petty Cash**: Track small expenditures.
  - **Liquidations**: Upload receipts to liquidate a budget request (supports partial returns).
  - **AI OCR**: Extract receipt totals and vendors automatically via AI.
- **SCARDS (Reports)**: Treasurer and Auditor co-sign aggregated financial reports. Exportable to PDF.

---

## 🛡️ Admin and IT Operations

- **System Roles (`super_admin` / `administrator`)**: 
  - The `super_admin` can assign new administrators, delete users, impersonate accounts, and act as both a learner and tutor for diagnostic reasons.
  - Officers (Main Committee Heads and above) can manually append service hours to ESAS Scholars.
- **Org Structure Page**:
  - Super admins can assign the Executive Board (President, VP, etc.) and Committee Heads.
  - Automatically updates the user's `role_id` and sets `role_expires_at` to June 30.
- **User Management**:
  - Inline role editing, suspension, and designation management.
  - QR Scanner for logging physical attendance in the Peer Learning Center.
- **Telemetry and Logs**:
  - Live system health dashboard (real row counts).
  - Interactive raw audit logs with filtering.
- **Cron Jobs**:
  - Sweeps for overdue books, event RSVPs, and auto-reverts expired org roles. Outputs a digest to a Discord Webhook.

---

## 🏆 Gamification and Customization

- **Leveling System**: XP is awarded securely via backend triggers (e.g., +50 XP per hour tutored).
- **Badges**: Auto-unlocked for milestones (e.g., 7-day streak, perfect quiz score).
- **Accessibility and Display**: High Contrast Mode and Dyslexia Font toggles in the header. Full Dark/Light/System theme toggling and Reduced Motion preferences available via the Settings panel.

---

## ⚙️ Application Preferences (Local)

- **Settings Panel (`/dashboard/settings`)**:
  - **Notifications**: Toggles for Session Booked emails, Review emails, and Browser Push notifications.
  - **Display**: Theme switching (Light/Dark/System) and Reduced Motion.
  - **Data & Privacy**: Toggles for Public Profile visibility and Analytics sharing. (Account deletion/export is handled securely under Profile Settings).
