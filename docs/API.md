# API Documentation

## AI & Tutoring
- `POST /api/v1/ai/chat`: AI Tutor endpoint (Kuya Nicolai persona). Supports multi-turn conversation history, image/file attachments, Socratic tutoring, and local WebLLM fallback. Rate limited (20/1m).
- `POST /api/v1/sessions`: Book tutoring sessions (1-on-1, group, recurring). Rate limited (10/1m).

## Users & RBAC
- `GET /api/v1/users/search`: Server-side user search enforcing RBAC visibility (Learners see Tutors; Tutors/Admins search all). Uses GIN trigram index (`pg_trgm`) for sub-100ms fuzzy ILIKE. Block-filtered in both directions.
- `POST /api/v1/users/block`: Block a user (backed by `user_blocks` table with RLS).
- `DELETE /api/v1/users/block`: Unblock a user.

## Events & QR Attendance
- `POST /api/v1/events/[id]/attendance`: Check-in and check-out event attendance via QR code or ID card. Calculates stay duration in minutes and awards XP (50 base XP + 1 XP/min, max 200 XP).
- `GET /api/v1/events/[id]/attendance`: Aggregate event participation metrics (`joinedCount`, `checkedInCount`) without revealing individual names.

## Authentication & Profiles
- `POST /api/v1/auth/card-login`: RFID Card Login. Rate limited (10/10m).
- `POST /api/v1/auth/register-card`: Register a new RFID card.
- `POST /api/account/export`: Export all user data.
- `POST /api/account/password`: Password reset. Rate limited (3/15m).

## Gamification
- `POST /api/xp/earn`: Award XP to a user. Includes DB-level constraints against negative XP and updates `profiles.total_xp` / `profiles.current_level` synchronously.
- `GET /api/gamification/daily`: Daily quest and streak status.

## Finance
- `POST /api/finance/ocr`: Receipt OCR via AI.
- `POST /api/finance/budget`: Submit budget request.

## Webhooks
- `POST /api/webhooks/email`: Trigger transactional emails via Resend. Protected route (Admins only). Uses strict templating.
- `POST /api/webhooks/push`: Register browser push subscription.
- `POST /api/webhooks/discord`: Send messages to Discord channels.

## Timesheets
- `GET /api/timesheets`: List active timesheet periods.
- `POST /api/timesheets/clock-in`: Start a shift with 2-hour automatic facility presence verification.

## Core Infrastructure
- `GET /api/health`: Uptime and DB reachability check.

## Rate Limiting Summary

Several API endpoints implement a Supabase-backed sliding-window rate limiter to prevent abuse:

- **AI Chat (`/api/v1/ai/chat`)**: 20 requests / 1 minute.
- **User Search (`/api/v1/users/search`)**: 30 requests / 1 minute.
- **RFID Card Login (`/api/v1/auth/card-login`)**: 10 requests / 10 minutes.
- **Password Reset (`/api/v1/account/password`)**: 3 requests / 15 minutes.
- **Session Booking (`/api/v1/sessions`)**: 10 requests / 1 minute.
- **Messaging (`/api/v1/messages/conversations`)**: 10 requests / 1 minute.
- **Resource Uploads (`/api/v1/repositories/[id]/resources`)**: 30 requests / 1 minute.
