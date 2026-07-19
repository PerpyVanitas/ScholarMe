# ADR 0002: Supabase as the Primary Backend

## Status
Accepted

## Context
ScholarMe requires a robust database, real-time capabilities, authentication, and file storage. Building these entirely from scratch using a raw Postgres instance, custom JWT handling, and S3 adds significant infrastructure overhead.

## Decision
We chose Supabase as our Backend-as-a-Service (BaaS). We leverage:
- **Postgres:** For relational data with strict Row-Level Security (RLS).
- **Supabase Auth:** For secure user management and token issuance.
- **Supabase Storage:** For handling resource uploads and finance attachments.
- **pgvector:** For native vector similarity search in our RAG implementation.

## Consequences
**Positive:**
- Accelerated development speed by offloading auth and storage.
- Security-first approach via RLS policies enforced directly at the DB layer.
- Native integration with Next.js via `@supabase/ssr`.

**Negative:**
- Vendor lock-in to Supabase-specific APIs (e.g., Auth client, Storage).
- Migrations and local testing require the Supabase CLI, which adds a dependency to the developer workflow.
