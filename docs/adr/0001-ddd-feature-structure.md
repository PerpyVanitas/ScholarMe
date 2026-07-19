# ADR 0001: Domain-Driven Design (DDD) Feature Structure

## Status
Accepted

## Context
As the ScholarMe application scales, placing all components, actions, and utilities into flat global directories (`components/`, `lib/`, `hooks/`) creates tight coupling and makes it difficult to reason about specific domain boundaries (e.g., Gamification vs. Finance).

## Decision
We adopted a feature-sliced Domain-Driven Design (DDD) architecture. Each major domain gets its own folder under `features/` (e.g., `features/finance/`, `features/gamification/`). 

Inside each feature folder, we colocate:
- `components/` (UI specific to the feature)
- `api/` (Database interactions and data fetching)
- `actions.ts` (Next.js Server Actions)
- `types.ts` (Domain-specific interfaces)
- `utils.ts` (Business logic)

## Consequences
**Positive:**
- High cohesion and low coupling.
- Easier to delete or refactor a feature without breaking others.
- Clear ownership boundaries.

**Negative:**
- Slightly more boilerplate when creating new features.
- Can be ambiguous where shared cross-domain components belong (they go to the global `components/ui` or `lib/`).
