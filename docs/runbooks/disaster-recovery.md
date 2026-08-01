# ScholarMe Operational Runbook — Disaster Recovery & Emergency Operations

> **Document Version**: 1.0.0  
> **Last Verified**: August 2, 2026  
> **Primary Contact**: IT Operations Team & Super Administrators (`admin@scholarme.org`)  

---

## 1. Overview & Service Scope

This operational runbook provides step-by-step procedures for handling critical system outages, database point-in-time recovery (PITR), secret rotation, and emergency service restoration.

---

## 2. Emergency Escalation Matrix

| Incident Severity | Trigger Criteria | Action Required | Response SLA |
| :--- | :--- | :--- | :--- |
| **SEV-1 (Critical)** | Database unavailable, total authentication outage, data loss | Execute PITR recovery, notify Super Admin immediately | < 15 minutes |
| **SEV-2 (Major)** | AI API rate limit exhaustion, storage upload failure | Switch to fallback model / local WebLLM mode | < 1 hour |
| **SEV-3 (Minor)** | Non-blocking UI component bug or formatting error | Patch via normal CI/CD PR workflow | < 24 hours |

---

## 3. Disaster Recovery Procedures

### 3.1 Database Point-In-Time Recovery (PITR)
In the event of accidental mass data deletion or database corruption:

1. Log into the **Supabase Cloud Console** → Project Dashboard → **Database Settings** → **Backups**.
2. Select **Point-In-Time Recovery (PITR)**.
3. Specify the exact timestamp (UTC) immediately preceding the incident.
4. Click **Restore Database**. Recovery takes ~5-15 minutes depending on DB size.
5. Verify DB readiness by pinging `/api/v1/health`.

### 3.2 Secret Key & API Token Emergency Rotation
If a service key or secret is leaked:

1. **Supabase Service Role / Anon Key**:
   - Go to Supabase Settings → API Keys → **Reset Service Role Key**.
   - Immediately update environment variables in production host (Vercel / Railway).
2. **Vertex AI / Gemini API Credentials**:
   - Go to Google Cloud Console → IAM & Admin → Service Accounts.
   - Delete leaked key ID and generate a new Service Account JSON key.
3. **Trigger Redeployment**:
   - Re-run production deployment pipeline to propagate rotated variables.

---

## 4. System Health Checks

- **Primary Health Check**: `GET /api/v1/health`
  - Expected Status: `200 OK`
  - Body: `{"status": "healthy", "checks": {"database": {"status": "ok"}, "environment": {"status": "ok"}}}`

---
*End of Operational Runbook.*
