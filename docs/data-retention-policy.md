# Data Retention Policy (P12-1)

This document defines how long specific classes of data are retained in ScholarMe, especially after a user departs the organization or deletes their account, aligning with the Philippine Data Privacy Act.

## 1. Active Data

- **Profiles & Core Identity:** Kept indefinitely while the account is active.
- **Messages & Forum Posts:** Retained indefinitely for institutional memory and context, but scrubbed of PII if the author's account is deleted.
- **Finance Records (Liquidations, Petty Cash):** Retained for a minimum of 5 years to comply with university/auditing financial regulations, even if the user leaves.

## 2. Account Deletion (Right to Erasure)

When a user requests account deletion (or is purged via an administrative GDPR/DPA request):
1. The Supabase `auth.users` record is deleted.
2. Due to the comprehensive `ON DELETE CASCADE` constraints in the database schema, this automatically purges:
   - `profiles`
   - `timesheets`
   - `analytics_logs`
   - `user_streaks`
   - `user_badges`
   - `sessions`
   - `session_ratings`
   - `auth_cards`
   - `device_tokens`
   - `push_subscriptions`
3. **Orphaned Files:** Any storage bucket files (avatars, receipts, library resources) linked to the user's `id` must be wiped. This is enforced via periodic storage cleanup cron jobs tracking missing `user_id`s, or handled instantly via `delete` hooks.

## 3. Financial & Academic Audits

Certain data cannot be erased immediately due to institutional requirements:
- If a user submitted a **Finance Liquidation** or **Budget Request**, their name/ID is retained in the historical finance ledgers to preserve audit trails.
- If a user generated an official **Timesheet** for university credit, those exported records may persist in external storage outside ScholarMe's jurisdiction.

## 4. Routine Pruning

To save database costs and reduce PII exposure footprint:
- **Chat History:** Old direct messages may be archived to cold storage after 12 months.
- **RAG Vector Embeddings:** If a library document is deleted, its corresponding chunks and vector embeddings are cascaded and deleted immediately (`ON DELETE CASCADE` via `library_resources`).
