# Monitoring & Uptime (P8-4)

ScholarMe uses `/api/v1/health` as the canonical health check endpoint.

## Health Check Response

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "build": "<VERCEL_GIT_COMMIT_SHA or 'local'>"
}
```

Failure responses return a non-2xx status with `{ "status": "error", "message": "..." }` — **never** raw DB error details.

## Uptime Monitor Setup

### Option A: BetterStack (Recommended)
1. Sign up at https://betterstack.com/uptime
2. Create a new monitor → URL: `https://scholarme.vercel.app/api/v1/health`
3. Check interval: **1 minute**
4. Assertion: Response status code = 200 AND body contains `"status":"ok"`
5. Alert: Slack/Discord webhook for the dev channel
6. Escalation: Email to primary contact after 3 consecutive failures

### Option B: UptimeRobot (Free tier)
1. Sign up at https://uptimerobot.com
2. New monitor → HTTP(s) → URL: `/api/v1/health`
3. Monitoring interval: 5 minutes (free tier limit)
4. Alert contacts: Slack integration or email

## What to Alert On

| Condition | Severity | Action |
|-----------|----------|--------|
| `/api/v1/health` returns non-200 | P1 | Page on-call, investigate DB |
| `/api/v1/health` times out (>10s) | P1 | Check Vercel + Supabase status |
| Sentry error spike >100/hr | P2 | Review new deployment |
| Auth flow failures spike | P1 | Check Supabase Auth service |

## Manual Health Check

```bash
curl https://scholarme.vercel.app/api/v1/health
```

Expected response: HTTP 200 with `"status":"ok"`.
