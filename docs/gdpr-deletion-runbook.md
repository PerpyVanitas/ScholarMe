# GDPR Data Deletion Runbook (P12-1)

When a user requests the Right to be Forgotten (Article 17 of GDPR or Section 16 of the Philippine Data Privacy Act), we must execute a hard delete of their Personal Identifiable Information (PII) within 30 days.

## 1. Verify the Request
1. Confirm the request originates from the verified email associated with the account.
2. If requested via a third-party, require a signed authorization form.

## 2. Execute the Deletion
Execute the following RPC function via the Supabase SQL Editor or through a Super Admin authenticated API call:

```sql
-- This function cascades and deletes the Auth user, Profile, and associated personal records.
-- It preserves anonymous analytical data (e.g., total sessions completed) but removes the linkage to the individual.
SELECT execute_gdpr_deletion('USER_UUID_HERE');
```

## 3. Verify Deletion
1. Confirm the user no longer appears in `auth.users`.
2. Confirm the user's `profiles` row is gone.
3. Confirm uploaded avatar in `resources/avatars/` bucket is deleted.

## 4. Financial Records Exception
> [!IMPORTANT]
> Under local tax and audit regulations, financial records (Budget Requests, Liquidations, Receipts) must be retained for 5-10 years.
> These records are **exempt** from immediate GDPR deletion. Ensure the finance module retains these records while anonymizing the user's display name if they have been hard-deleted from the `profiles` table.

## 5. Send Confirmation
Reply to the user's request confirming that all non-exempt PII has been permanently removed from the active database and will age out of backups within 7 days.
