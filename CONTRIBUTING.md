# Contributing to ScholarMe

First off, thank you for considering contributing to ScholarMe!

## Development Setup

1. **Clone the repository**
   `ash
   git clone https://github.com/your-org/ScholarMe.git
   cd ScholarMe
   ``n
2. **Web Frontend & API (Next.js)**
   `ash
   corepack enable
   corepack prepare pnpm@10.28.0 --activate
   pnpm install
   pnpm run dev
   ``n
3. **Database (Supabase)**
   The project uses Supabase for database, authentication, and storage. Refer to the .env.example file for necessary environment variables.

## Architecture Guidelines

### Routing (pp/) vs Features (eatures/)
- **pp/ Directory:** Used strictly for Next.js App Router routing, layout definitions, error boundaries, and API route handlers (oute.ts). Keep logic here minimal, mostly focused on data fetching and orchestrating components.
- **eatures/ Directory:** Used for domain-specific components, hooks, and logic (e.g., eatures/tutors, eatures/gamification). Reusable components should go here instead of cluttering the pp/ directory.

## Testing

Ensure your changes pass existing tests before submitting a Pull Request:
- **Unit/Integration Tests**: We use Vitest. Run pnpm run test or pnpm run test:watch.
- **Linting**: Run pnpm run lint and pnpm tsc --noEmit.
- **Zero-Tolerance for ny**: We enforce strict TypeScript typing. Do not use @typescript-eslint/no-explicit-any.

## Pull Request Guidelines

- We use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for commit messages and PR titles (e.g., eat(web): add login page, ix(api): resolve race condition in sessions).
- Reference any relevant issues in your PR description.
- Ensure CI workflows pass successfully before requesting a review.
- Every reported and fixed bug must include a permanent regression test.

