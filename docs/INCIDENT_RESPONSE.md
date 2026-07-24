# Incident Response Runbook (P8-5)

> [!NOTE]
> This is a template. Fill in the `[FILL IN]` sections before going live.

## 1. Contact List

| Role | Name | Contact |
|------|------|---------|
| Primary On-Call | Security Team | oncall@scholarme.com |
| Supabase Admin | Database Admin | dbadmin@scholarme.com |
| Vercel Admin | DevOps | devops@scholarme.com |
| Backup Contact | Engineering Manager | engineering@scholarme.com |

## 2. Service Status Pages

- **Supabase**: https://status.supabase.com
- **Vercel**: https://www.vercel-status.com
- **Sentry**: https://status.sentry.io

## 3. Health Check

```bash
# Quick health check
curl https://scholarme.com/api/v1/health

# Expected: HTTP 200 with { "status": "ok", "timestamp": "..." }
```

## 4. Where Secrets Live

| Secret | Location |
|--------|----------|
| Supabase Service Role Key | Vercel Dashboard → Project → Environment Variables |
| Sentry DSN | Vercel Dashboard → Environment Variables |
| RESEND_API_KEY | Vercel Dashboard → Environment Variables |
| Google OAuth Credentials | Supabase Dashboard → Auth → Providers |

> [!CAUTION]
> **NEVER** commit secrets to git. If a secret is accidentally exposed:
> 1. Rotate it immediately in the provider dashboard
> 2. Update the Vercel environment variable
> 3. Redeploy the project

## 5. Rollback a Bad Deploy (Vercel Instant Rollback)

1. Go to Vercel Dashboard → Project → Deployments
2. Find the last known-good deployment
3. Click the `...` menu → **Promote to Production** (or **Instant Rollback**)
4. Verify `/api/v1/health` returns 200

## 6. Rollback a Bad DB Migration

See `docs/migration-rollback-runbook.md`.

## 7. Common Incidents & Responses

### 7a. "Database connection failed" in health check
1. Check Supabase status page
2. In Supabase Dashboard → Settings → Database → check connection pool usage
3. If pool exhausted: temporarily suspend heavy background jobs
4. If Supabase is down: wait + escalate to Supabase support

### 7b. Auth broken — users cannot log in
1. Check Supabase Auth service status
2. In Supabase Dashboard → Auth → check recent error logs
3. If OAuth broken: check provider (Google) credential expiry
4. Fallback: manually create a magic link for urgent users

### 7c. Spike in 500 errors
1. Check Sentry for the dominant error signature
2. Check Vercel logs for the specific route
3. If due to new deploy → rollback (see §5)
4. If due to DB migration → rollback migration (see `docs/migration-rollback-runbook.md`)

### 7d. Finance data discrepancy reported
1. Do NOT modify production data without a written trace
2. Pull the relevant record from Supabase Dashboard
3. Document the discrepancy in the incident log
4. Fix via the Admin panel if possible; otherwise run a carefully-reviewed SQL update

## 8. Post-Incident Write-Up

File an incident report within 24 hours in the Internal Wiki (Notion/Confluence):
- **Timeline**: When was it detected? When resolved?
- **Impact**: Who was affected? How many users?
- **Root Cause**: What went wrong?
- **Fix Applied**: What was done?
- **Prevention**: What prevents this from recurring?
