# API Documentation

## Authentication & Profiles
- `POST /api/auth/card-login`: RFID Card Login. Rate limited (5/15m).
- `POST /api/auth/register-card`: Register a new RFID card.
- `POST /api/account/export`: Export all user data.

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
