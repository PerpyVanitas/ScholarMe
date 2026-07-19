# Incident Response Standard Operating Procedure (SOP)

## 1. Initial Assessment
When an alert is triggered or a critical issue is reported:
- **Acknowledge:** Post in the #incidents Discord/Slack channel acknowledging the alert.
- **Verify:** Confirm if the issue is isolated (one user) or systemic (database down, 500 errors globally). Check `/api/health`.

## 2. Severity Levels
- **SEV-1 (Critical):** Core system down, database unreachable, widespread data corruption. (SLA: 15 mins)
- **SEV-2 (High):** Major feature broken (e.g., cannot book sessions, cannot process budgets). (SLA: 1 hour)
- **SEV-3 (Medium):** Non-critical bugs, localized UI issues. (SLA: Next sprint)

## 3. Communication Plan
- **Internal:** Notify the executive team via the internal chat.
- **External:** If SEV-1 or SEV-2 affects users, post a status update to the public Discord/social channels.

## 4. Rollback & Remediation
- **Bad Deployment:** Revert the last Vercel deployment instantly via the Vercel dashboard.
- **Bad Migration:** If a database migration caused the issue, follow the rollback runbook (see STAGING_SETUP.md / Rollback docs).
- **Service Outage:** If Supabase is down, monitor their status page and communicate the ETA.

## 5. Post-Incident Review (Post-Mortem)
For any SEV-1 or SEV-2 incident, create a post-mortem document within 48 hours covering:
- Timeline of events
- Root cause analysis
- Action items to prevent recurrence
