# API Documentation

## Authentication & Profiles
- `POST /api/auth/card-login`: RFID Card Login. Rate limited (10/10m).
- `POST /api/auth/register-card`: Register a new RFID card.
- `POST /api/account/export`: Export all user data.
- `POST /api/account/password`: Password reset. Rate limited (3/15m).

## Gamification
- `POST /api/xp/earn`: Award XP to a user. Includes DB-level constraints against negative XP.
- `GET /api/gamification/daily`: Daily challenge status.

## Finance
- `POST /api/finance/ocr`: Receipt OCR via AI.
- `POST /api/finance/budget`: Submit budget request.

## Webhooks
- `POST /api/webhooks/email`: Trigger transactional emails via Resend. Protected route (Admins only). Uses strict templating.
- `POST /api/webhooks/push`: Register browser push subscription.
- `POST /api/webhooks/discord`: Send messages to Discord channels.

## Timesheets
- `GET /api/timesheets`: List active timesheet periods.
- `POST /api/timesheets/clock-in`: Start a shift.

## Core Infrastructure
- `GET /api/health`: Uptime and DB reachability check.

## Rate Limiting Summary

Several API endpoints implement a Supabase-backed sliding-window rate limiter to prevent abuse:

- **RFID Card Login (`/api/auth/card-login`)**: 10 requests / 10 minutes.
- **Password Reset (`/api/account/password`)**: 3 requests / 15 minutes.
- **Session Booking (`/api/sessions`)**: 10 requests / 1 minute.
- **Messaging (`/api/messages/conversations`)**: 10 requests / 1 minute.
- **Resource Uploads (`/api/repositories/[id]/resources`)**: 30 requests / 1 minute.
