# ScholarMe — User Interaction & Feature Map

> This document tracks all verified features and user interactions across the ScholarMe platform.  
> It must be reviewed at the end of every development cycle to ensure no features have been orphaned or broken by new updates.  
> Last updated: 2026-07-13

---

## 🔐 Auth & Onboarding

- **Sign up / Login**: Users can authenticate via Email/Password or OAuth providers.
- **Onboarding Flow**: First-time login forces users into a multi-step onboarding wizard:
  1. Accept Terms & Conditions.
  2. Complete profile details (Full Name, Avatar).
  3. Enter academic details (`degree_program`, `year_level`).
  - _Constraint:_ Users cannot bypass onboarding. The dashboard routes redirect back to setup if `profile_completed` is false.

---

## 📚 Study & Learning Tools (AI Powered)

- **Quizzes & Flashcards Module**:
  - **Create Study Sets**: Users can create study sets manually, or generate them using AI by uploading a PDF resource.
  - **AI Generation**: Powered completely free by Local AI (`WebWorkerMLCEngine`) running in the browser. Server-side Gemini API acts as a rate-limited fallback (2 requests/min) for large document extraction.
  - **Image Occlusion**: Users can attach an image to a flashcard and draw interactive occlusion masks (rectangles) over it. During study mode, clicking the mask reveals the hidden part.
  - **Study Modes**:
    - _Spaced Repetition (SRS)_: Replaces standard self-grading. Users rate their confidence (Again/Hard/Good/Easy), powering the SM2 algorithm.
    - _Typing Mode_: Forces learners to type the exact answer.
    - _TTS_: Native browser Text-to-Speech reads questions and answers.
  - **Exporting**: Users can export any study set to an Anki/Quizlet compatible CSV format.
  - **Flagging**: Users can flag inaccurate AI-generated questions for admin review.
- **AI Tutor (WebLLM)**: An omnipresent chat interface where users can ask academic questions to a locally running AI model.

---

## 📅 Tutoring & Sessions

- **Find a Tutor**: Learners browse the active roster of tutors. (`super_admin`, `administrator`, and `learner` accounts are excluded from search results).
- **Booking Flow**:
  - **1-on-1 Sessions**: Learner selects a subject, picks an available timeslot from the tutor's schedule, and adds prep notes.
  - **Group Sessions**: Learner can specify `max_participants` (up to 5).
  - **Recurring**: Tutors can accept 4-week recurring session blocks.
- **Waitlists & Open Groups**:
  - Learners can browse "Open Groups" and join them.
  - If a group is full, learners can join a Waitlist. If a participant cancels, the first waitlisted user is auto-promoted.
- **Session Management (Tutor)**:
  - **Substitute**: A tutor can send a transfer request to another tutor if they cannot make a confirmed session.
  - **Reschedule**: Propose a new time to the learner instead of forcing a change.
  - **Auto-Approve**: Toggle to auto-accept bookings from learners they've successfully tutored before.
- **Mastery Verification**: Tutors upload physical documents (transcripts) to prove they can teach a subject. Admins review and approve these in the dashboard.
- **Peer Reviews**: Lead Tutors and Committee Heads can write 1-5 star evaluations for junior tutors. Regular tutors can only read their own reviews.

---

## 📁 Library & Resources

- **Digital Resources**:
  - Upload PDFs, Images, Docs.
  - **Visibility**: Toggle `is_public` to lock resources to authenticated org members only.
  - **Preview & Download**: In-browser object preview (PDFs) with fallback download links.
- **Physical Library (CFMR Only)**:
  - **Catalog**: Inventory of actual books.
  - **Barcode Scanner**: Scan ISBNs via webcam using `html5-qrcode` to find or add books.
  - **Checkout Flow**: Admins check out books to learners, setting a due date.
- **Interactive Campus Map**: Visual modal to guide users to physical resources and the tutoring center.

---

## 👥 Community & Networking

- **Study Groups**: Users can create public or private study groups. Includes a Supabase Realtime chat interface.
- **Forums (Discussions)**: Organization-wide discussion boards. Users can post, reply, and upvote.
- **Direct Messaging**: 1-on-1 chats with read receipts, pinned messages, threaded replies, and file attachments (with proper HTML5 download attributes).
- **Networking**:
  - _Study Buddies_: Algorithmic matching of peers in the same degree program and year.
  - _Alumni Directory_: Connect with graduated students.
- **Live Support Chat**: Floating widget connecting users directly to a Super Admin for immediate help.

---

## 💰 Finance Module

- **Role Constraints**: Heavily locked down. Final approval on large requests is restricted exclusively to the `president`.
- **Workflows**:
  - **Budget Requests**: Save as draft, submit, multi-step approval.
  - **Petty Cash**: Track small expenditures.
  - **Liquidations**: Upload receipts to liquidate a budget request (supports partial returns).
  - **AI OCR**: Extract receipt totals and vendors automatically via AI.
- **SCARDS (Reports)**: Treasurer and Auditor co-sign aggregated financial reports. Exportable to PDF.
- **Dashboards**: Budget remaining progress bars, CSV exports of all financial tables.

---

## 🛡️ Admin & IT Operations

- **System Roles**: Only `super_admin` can assign new administrators, delete users, or impersonate accounts.
- **Org Structure Page** (`super_admin` only):
  - Toastmasters-style interface to assign the Executive Board (President, VP, etc.) and Committee Heads.
  - Supports Term Management (e.g., A.Y. 2026-2027).
  - Automatically updates the user's `role_id` and sets `role_expires_at` (June 30).
- **User Management**:
  - Inline role editing, suspension, and designation management.
  - QR Scanner for logging physical attendance.
- **Telemetry & Logs**:
  - Live system health dashboard (real row counts).
  - Interactive raw audit logs with filtering.
- **Cron Jobs & Reminders**:
  - `/api/admin/cron/reminders` sweeps for overdue books, event RSVPs, and auto-reverts expired org roles. Outputs a digest to a Discord Webhook.
- **Organization Settings**: Change the global primary theme color (white-labeling) and landing page hero text.

---

## 🎮 Gamification & Customization

- **Leveling System**: XP is awarded securely via backend triggers (e.g., +50 XP per hour tutored). Level scaling follows `FLOOR(0.1 * SQRT(total_xp)) + 1`.
- **Badges**: Auto-unlocked for milestones (e.g., 7-day streak, perfect quiz score).
- **Leaderboard**: Global ranking based on XP.
- **A11y**: High Contrast Mode and Dyslexia Font toggles in the header. Dark/Light mode support.

---

## 📱 Mobile & PWA Experience

- **Responsive Layouts**: Data tables wrap with horizontal scrolling; grid layouts collapse to single columns.
- **Sidebar**: Mobile hamburger drawer exposes all navigation links.
- **PWA**: WebWorkerMLCEngine guarantees offline-capable AI generations once models are cached.
