# Scale Considerations & Mitigations

As ScholarMe grows, several constraints in the initial MVP architecture could impact performance and data privacy. This document outlines those considerations and mitigation strategies.

## 1. Database Query Performance

**Current Bottlenecks:**
- Tutor search (`app/api/tutors/route.ts`) originally filtered records in-memory via JavaScript.
- Admin user search fetched all profiles without limits.

**Mitigation (Phase 14):**
- Server-side pagination added using Supabase `.range(offset, limit)`.
- Added PostgreSQL indexes (`idx_tutor_profiles_specializations`, `idx_tutor_profiles_availability_status`, `idx_tutor_profiles_average_rating`) to optimize filter speed for tutors.
- Re-architected API responses to return `meta: { total, page, limit }` instead of full datasets.

## 2. PII / Data Privacy (Philippine Data Privacy Act Compliance)

**Current Constraints:**
- User data erasure requires sweeping `forum_posts`, `forum_replies`, and `feedback` tables which reference `auth.users(id)`.
- Soft-deletions must be handled cautiously so as not to break referential integrity while removing sensitive data.

**Mitigation:**
- Avoid hard constraints that cascade deletions automatically unless intentionally designed.
- Implement specialized "data export" and "data erasure" APIs or runbooks to ensure users have the Right to Erasure and Right to Data Portability.

## 3. Server-Side Rendering (SSR) overhead

**Current Constraints:**
- Dynamic API routes fetching large joins (e.g. `tutors -> profiles -> specializations`) might delay Time to First Byte (TTFB).

**Mitigation:**
- Employ Next.js caching or Supabase Redis caching layer when tutor profiles are mostly static.
- Client-side data fetching combined with SWR/React Query for real-time reactivity without taxing the edge functions constantly on identical reads.

## 4. Large Form Uploads

**Current Constraints:**
- File uploads for Profile Pictures or ID Cards pass through base64 or heavy payloads in Server Actions.

**Mitigation:**
- In the future, implement direct-to-storage signed URLs instead of passing large binaries through the Next.js API layer.

*(End of Phase 14 Assessment)*
