# Contributing to ScholarMe

First off, thank you for considering contributing to ScholarMe!

## Development Setup
*(To be expanded: Instructions for setting up Supabase, Node, etc.)*

## Testing Philosophy

ScholarMe maintains a strong testing culture to ensure reliability and prevent regressions, especially for high-risk endpoints (AI processing, Financial transactions, etc).

### 1. Integration Tests vs Route-level Tests
We use both Integration tests (`__tests__/integration/`) and Route-level tests (`__tests__/api/` or co-located `__tests__/route.test.ts`).

**Integration tests supplement, but DO NOT replace, route-level tests.**

- **Route-level tests** are mandatory for regression protection. They ensure that a specific endpoint's response shape, error handling, validation, and fallback mechanisms remain intact. You must add these for any new endpoints you create, especially AI or messaging routes.
- **Integration tests** test the behavior at the feature level across multiple domains (e.g. "User signs up and creates a study group").

If you are modifying an existing route, ensure its route-level test is updated. If one does not exist, please add it!

### 2. E2E Naming Conventions
- Playwright end-to-end tests live in `/e2e`.
- Multi-step feature flows written in Vitest live in `/__tests__/flows/` (formerly `__tests__/e2e/`).

### 3. Resilience and Fallbacks
Every external API call (Vertex AI, Document AI, Stripe) must have tests proving that the system gracefully degrades if the external service fails or times out.

## Code Quality
- We enforce zero `any` types. Use `unknown` or specific types/interfaces.
- Run `npm run lint` before committing.
- Ensure all tests pass by running `npm run test`.
