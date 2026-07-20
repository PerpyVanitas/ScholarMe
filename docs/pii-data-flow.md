# PII Data Flow Map (P12-2)

ScholarMe processes Personal Identifiable Information (PII) to manage academic identity and organizational finance. This document maps the classification and location of PII within the system to ensure compliance with the Philippine Data Privacy Act and GDPR.

## 1. High-Level PII Classifications

| Data Category | Examples | Sensitivity |
|---------------|----------|-------------|
| Identity Data | Full Name, Email, Avatar Photo, Signature | High |
| Academic Data | University ID, Year Level, Degree Program | Medium |
| Authentication| Hashed PINs, OAuth Tokens, Session Cookies | Critical |
| Finance Data  | Receipts, Budget Proposals, Account Names | High |
| Behavioral    | IP Addresses, Browser Fingerprint, Login Times | Low |

## 2. Storage Locations

### PostgreSQL (Supabase)
- `auth.users`: Email addresses, Auth Provider identities, Last Sign In IPs.
- `public.profiles`: Full names, academic affiliations, avatar URLs.
- `public.auth_cards`: Hashed smart card PINs.
- `public.login_history`: Timestamps, IP hashes, User Agents.

### Supabase Storage (S3-compatible)
- `resources/avatars`: Profile pictures.
- `finance/receipts`: Uploaded images of financial transaction proofs.
- `verifications/transcripts`: PDF transcripts or certificates (Highly Sensitive).

## 3. Data Flow & Sub-processors

1. **Authentication (Supabase Auth)**: User logs in via Google OAuth. Name and Email flow from Google -> Supabase `auth.users` -> Trigger inserts into `public.profiles`.
2. **AI Tutoring (Google Gemini via API)**: Resource text is sent to Google's API for embedding generation. **Rule**: Do not send PII in resource text to the AI model.
3. **Local AI (WebLLM)**: Flashcard chats run entirely in the browser. No data leaves the user's device for WebLLM chats.
4. **Error Tracking (Sentry)**: Application errors are sent to Sentry. **Rule**: Do not log raw `error.message` if it contains PII or DB details. Log `hashUserId(user.id)` instead of raw UUIDs.

## 4. Retention Policies

| Data Type | Retention Period | Action |
|-----------|------------------|--------|
| Login History | 90 Days | Cron job auto-purges |
| Active Profiles | Indefinite | Deleted upon user request (GDPR) |
| Finance Receipts| 5-10 Years | Kept for statutory audit compliance |
| System Logs (Pino) | 30 Days | Managed by log aggregator |
