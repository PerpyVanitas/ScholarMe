# Unimplemented QoL Features Tracker

Last audited: 2026-07-07 (Phase 29 complete)

## Legend

- [x] Implemented

- [ ] Not implemented / partial

## Global UX

- [x] Global Command Palette (Cmd+K)

- [x] Sidebar navigation groups

- [x] Skeleton loaders

- [x] Tooltips on icon buttons

- [x] Unsaved changes warnings

## Gamification

- [x] Study streaks

- [x] XP / levels

- [x] Confetti celebrations

- [x] Onboarding tour (driver.js)

- [x] Achievements / badge display

- [x] Automatic badge unlocking

## Community

- [x] Organization Forums (create, view, reply)

- [x] Study Groups (join + create + detail page)

- [x] Study group shared chat room (realtime)

- [x] Events calendar with syllabus AI parser

- [x] Syllabus events persisted to facility_events

## Learner Experience

- [x] Smart tutor recommendations

- [x] Quick rebook

- [x] Waitlists

- [x] Physical library catalog + checkout

- [x] Campus map

- [x] Flashcard SRS (SM2)

- [x] Flashcard fork

- [x] AI quiz flagging

- [x] Recurring session booking

- [x] Group session size selection

- [x] Join open group sessions (participant UI)

- [x] Prep notes on booking

- [x] No-show penalties

- [x] AI Tutor (WebLLM)

## Tutor Experience

- [x] Bulk availability copy

- [x] Vacation mode (is_paused)

- [x] Calendar .ics sync

- [x] Auto-approve past learners

- [x] Draggable dashboard layout

- [x] 12-hour clock-out alert

- [x] Mastery verification claims

- [x] Tutor memos on sessions

- [x] Substitution flow

- [x] Rescheduling flow

- [x] Peer reviews (lead tutors) — consolidated on `tutor_reviews`

- [x] Tutor strikes on no-show

## Admin / Finance

- [x] Bulk ID PDF export

- [x] Custom data CSV export

- [x] System health dashboard + cron trigger

- [x] Real table row counts on System Health

- [x] Mastery verification review

- [x] Automated email reminders (Resend)

- [x] Discord admin digest

- [x] Cash register mode

- [x] GDPR account data export (fixed schema)

## Profile / Security

- [x] Pronouns, status message, social links

- [x] Login history display

- [x] Login history recording on sign-in

## Analytics

- [x] Event persistence to `analytics_logs`

- [x] Dashboard page view tracking

- [ ] PostHog SDK script (optional — wire `NEXT_PUBLIC_POSTHOG_KEY` when ready)

## Remaining / Future

- [ ] Supabase Management API for exact disk/storage quotas

- [ ] Drop legacy `tutor_peer_reviews` table after migration verified in production
