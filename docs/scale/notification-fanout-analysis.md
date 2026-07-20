# P14-8: Notification Fan-out Load Analysis

## Overview

This document analyses the performance characteristics of ScholarMe's two notification delivery systems at scale (17,000 potential learners / 200 daily operational officers) and defines acceptance thresholds, bottleneck risks, and mitigations.

---

## Notification Delivery Architecture

ScholarMe uses **two distinct push channels**:

| Channel | Implementation | Trigger Path | Scale Risk |
|---|---|---|---|
| **Web Push (VAPID)** | `lib/push-notifications.ts` via `web-push` npm | Server-to-user, per-user DB query + HTTP to push service | ⚠️ Sequential DB reads at fan-out; N×API calls |
| **Supabase Realtime** | WebSocket channels per feature (messaging, polls, support, study groups) | Client-held persistent WS connection | ⚠️ Concurrent channel limit on Supabase plan |

---

## System 1: Web Push (VAPID) Fan-out

### How it Works

```
Admin/Cron trigger → lib/push-notifications.ts::sendPushNotification(userId)
  → supabase: SELECT * FROM push_subscriptions WHERE user_id = ?
  → Promise.all(subscriptions.map(sub => webpush.sendNotification(sub)))
  → supabase: DELETE FROM push_subscriptions WHERE id IN (expired)
```

### Fan-out Scenario: Event Announcement to All Officers

When an admin broadcasts a push notification to all 200 active officers:

| Metric | Estimate |
|---|---|
| Officers receiving push | 200 |
| Avg. subscriptions per officer (multi-device) | 2 |
| Total `push_subscriptions` DB reads | 200 |
| Total `webpush.sendNotification()` calls | 400 |
| External HTTP calls to FCM/APNS | 400 |
| Expected time (serial loop, 200ms/call) | **~80 seconds** ❌ |
| Expected time (all parallel, Promise.all per user) | **~1–3 seconds** ✅ |

### Critical Issue Found: Sequential Fan-out

The **current cron job (`/api/admin/cron/reminders/route.ts`)** processes notifications in a sequential `for...of` loop with `await` inside:

```ts
// ❌ SLOW: Each sendEmail() is awaited before the next starts
for (const rsvp of goingRsvps) {
  const res = await sendEmail({ to: profile.email, ... }); // blocks next
}
```

At 200 officers × ~200ms per email = **~40 seconds per cron run**. With the Vercel 60-second function timeout, **this will silently fail when the officer list exceeds ~250 people**.

### Fix: Batch the Fan-out

Replace the sequential email loop with `Promise.allSettled`:

```ts
// ✅ FAST: All sends fire simultaneously, failures don't block others
const results = await Promise.allSettled(
  goingRsvps.map(rsvp =>
    sendEmail({
      to: rsvp.profile.email,
      subject: `Reminder: ${event.title} is coming up!`,
      html: emailHtml(rsvp.profile, event),
    })
  )
);
remindersSent = results.filter(r => r.status === "fulfilled" && r.value.success).length;
```

---

## System 2: Supabase Realtime WebSocket Fan-out

### Active Channels in ScholarMe

| Channel Pattern | File | Multiplier |
|---|---|---|
| `conversation:{id}` | `use-realtime-messages.ts` | 1 per open DM |
| `global-messages` | `message-toast-provider.tsx` | 1 per online user |
| `global_chat_updates` | `chat-interface.tsx` | 1 per online user |
| `study-group:{groupId}` | `study-group-chat.tsx` | 1 per open group |
| `tutors-presence` | `tutors-list.tsx` | 1 per user on tutors page |
| `poll_votes_{id}` | `voting/page.tsx` | 1 per live poll |
| `support-{id}` | `support-chat-widget.tsx` | 1 per open ticket |
| `notifications` | `user-context.tsx` | **1 per logged-in user** |

### Concurrent WebSocket Connection Count at 500 CCU

Assuming each logged-in user holds the `global-messages` + `notifications` channels:

| Scenario | Connections per User | Total at 500 CCU |
|---|---|---|
| Minimum (background) | 2 | **1,000 WS connections** |
| Active DM user | 4 | 2,000 |
| Admin in support view | 5 | 2,500 |

### Supabase Realtime Limits by Plan

| Plan | Max Concurrent Connections | Recommendation |
|---|---|---|
| Free | 200 | ❌ Insufficient |
| Pro | 500 | ⚠️ At the edge at 500 CCU |
| **Team/Enterprise** | Custom (2,000+) | ✅ Required for 17k users |

> **Action Required:** Upgrade Supabase plan to **Team** tier before going live with 17,000 users. At 500 CCU this exhausts the Pro plan's Realtime limit.

---

## Thresholds & Acceptance Criteria (k6)

The test script at `tests/load/notification-fanout.js` enforces:

| Metric | Threshold | Rationale |
|---|---|---|
| `ws_connect_errors` | `< 1%` | WS failures cause silent message loss |
| `ws_message_latency_ms p(95)` | `< 2,000ms` | 2s is the user-perceptible "instant" threshold |
| `push_errors` | `< 2%` | Web push is non-critical but should be reliable |
| `push_delivery_ms p(95)` | `< 5,000ms` | Push accepted within 5s |

### How to Run

```bash
# Prerequisites
choco install k6    # Windows
brew install k6     # Mac

# Set environment
$env:BASE_URL      = "https://staging.scholarme.app"
$env:AUTH_TOKEN    = "eyJ..."
$env:SUPABASE_URL  = "https://xxxx.supabase.co"
$env:SUPABASE_ANON_KEY = "eyJ..."

# Run
k6 run tests/load/notification-fanout.js
```

---

## Recommended Fixes (Priority Order)

### 🔴 P1 — Fix sequential email fan-out in cron job

**File:** `app/api/admin/cron/reminders/route.ts`  
**Risk:** Silent Vercel timeout at >250 officer recipients  
**Fix:** Replace all `for...of await sendEmail()` loops with `Promise.allSettled()`

### 🟠 P2 — Upgrade Supabase plan before launch

**Risk:** 500 CCU saturates Pro plan Realtime connections  
**Fix:** Upgrade to Supabase Team plan (custom connection limits)

### 🟡 P3 — Add Realtime channel cleanup guard

**Risk:** `global-messages` and `global_chat_updates` are both subscribed in `chat-interface.tsx` for every user, doubling the connection count  
**Fix:** Deduplicate — use a single channel with a broader `filter` instead of two identical channels

### 🟢 P4 — Add push subscription cleanup cron

**Risk:** `push_subscriptions` table accumulates stale entries from users who cleared browser data, causing unnecessary fan-out queries  
**Fix:** Weekly cron: `DELETE FROM push_subscriptions WHERE updated_at < NOW() - INTERVAL '90 days'`

---

## Summary

| Item | Status |
|---|---|
| k6 test script | ✅ Created (`tests/load/notification-fanout.js`) |
| Sequential email fan-out bug | ⚠️ Identified — needs fix in cron job |
| Supabase Realtime plan upgrade | ⚠️ Needed before production launch |
| Web Push architecture | ✅ Correct (per-user `Promise.all` in `lib/push-notifications.ts`) |
| Push subscription cleanup | ⚠️ No cleanup cron exists |
