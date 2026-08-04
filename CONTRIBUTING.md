# Contributing to ScholarMe

First off, thank you for considering contributing to ScholarMe!

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/ScholarMe.git
   cd ScholarMe
   ```
2. **Web Frontend & API (Next.js)**
   ```bash
   corepack enable
   corepack prepare pnpm@10.28.0 --activate
   pnpm install
   pnpm run dev
   ```
3. **Database (Supabase)**
   The project uses Supabase for database, authentication, and storage. Refer to the `.env.example` file for necessary environment variables.

## Architecture Guidelines

### Routing (`app/`) vs Features (`features/`)
- **`app/` Directory**: Used strictly for Next.js App Router routing, layout definitions, error boundaries, page components, and API route handlers (`route.ts`). Route-specific server actions or single-page views belong here.
- **`features/` Directory**: Used for cross-cutting domain-specific components, state, hooks, and business logic (e.g., `features/tutors`, `features/gamification`, `features/events`). Reusable business logic used across multiple routes MUST go in `features/`.

## Testing & Ruleset Baseline

Ensure your changes adhere to the **ScholarMe AI Development Ruleset v2** and pass all CI checks before submitting a Pull Request:
- **Unit/Integration Tests**: Run `pnpm run test` or `pnpm run test:watch`.
- **Linting**: Run `pnpm run lint --fix` and `pnpm tsc --noEmit`.
- **Navigation & UI Consistency**: Verify button labels, icons, and destinations agree.
- **Regression Protection**: Every reported bug fix MUST include a permanent regression test.

## Pull Request Guidelines

- We use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for commit messages and PR titles (e.g., `feat(web): add login page`, `fix(api): resolve race condition in sessions`).
- Reference any relevant issues in your PR description.
- Ensure CI workflows pass successfully before requesting a review.
