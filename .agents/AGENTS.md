# ScholarMe Project Rules

## CHANGELOG Management

- **Always Read the Changelog:** At the start of every new chat or when investigating the state of the project, you MUST read the `documentation/CHANGELOG.md` file located in the workspace to understand recent updates.
- **Always Update the Changelog:** Whenever you complete a feature, fix a bug, or make significant changes to the codebase, you MUST append a detailed entry to `documentation/CHANGELOG.md` before finishing your task. Format it cleanly with the date and a summary of what was accomplished.

## Task Iteration

- **Continuous Phase Execution:** Whenever a user gives a large task that is broken down into phases, routinely check if there are still tasks or things that are unimplemented. Continue iterating until the entire backlog is finished. Once finished, do a final check if everything has been implemented before reporting the walkthrough and ending the iteration.

## Cycle End Requirements: Documentation Maintenance

At the end of every instruction implementation cycle (e.g., when finishing a task, fixing a bug, or implementing a new feature), you MUST maintain and review these documentation files:

- **documentation/map.md**: This file contains a comprehensive list of all possible interactions a user has. You must review this list to ensure all interactions are still working according to expectations.
- **documentation/schema.md**: This file contains the current expected version of the database schema. You must keep this updated so it can be easily compared against the actual schema in the database.
- **documentation/rbac.md**: This file contains the authoritative access control rules. Keep it updated if roles change.

Always review and update these documentation files before concluding your work and presenting the final walkthrough.

## Pre-Commit Linting

- **Auto-Fix Workflow:** Before finalizing a feature, making a commit, or finishing an iteration, you MUST proactively run `eslint . --fix` (or `pnpm run lint --fix` if available). This mimics the human developer "Auto-Fix on Save" behavior and prevents basic linting errors (like unescaped quotes or spacing) from breaking the CI pipeline.

## Background Task Management & Monitoring

- **Pre-flight Cleanup:** Before starting a new long-running background task (like a build or test suite), you MUST use the `manage_task` tool with `Action: 'list'` to check for any currently running background tasks. If there is an existing task doing the exact same thing or an outdated version of the same job, use `manage_task` with `Action: 'kill'` to terminate it before launching the new one.
- **Proactive Monitoring:** Whenever you launch a long-running background task, you MUST use the `schedule` tool to set a one-shot timer (e.g., 5-10 minutes) as a timeout.
- **Handling Freezes:** If the timer expires and the system wakes you up without the task completing, use the `manage_task` tool with `Action: 'status'` to check if the task is making progress or is frozen.
- **Intervention:** If the task appears frozen (no recent log updates for a long time) or stuck in an infinite loop, notify the user, investigate the logs, and consider using `Action: 'kill'` to terminate it if appropriate.

## Bug Fix Regression Testing

- **Permanent Regression Coverage:** Every time you report and fix a bug, it MUST become a permanent regression test. If it is possible to create an automated test for the issue (using Vitest, Jest, Playwright, or whichever testing framework is appropriate for the domain), you must proactively create it alongside your fix.
- **No Manual Catching:** The goal is to ensure the user never has to manually catch the same bug again. Do not finish fixing a bug without ensuring the test suite guards against its recurrence.

## Development Guardrails (Repo-Specific)

The following rules exist because of specific, real problems found in this repo — not generic best practices. Treat a violation the same as a failing test.

### Rule 1 — Check Before Creating

- Before creating a new file, search the repo for an existing file with the same name or purpose in any location. Use `grep` or ripgrep.
- Before writing a new utility, type, or helper, search for an existing one doing the same job under a different name.
- If something similar exists, extend or reuse it. Only create a parallel version if you can state in one sentence why the existing one can't be modified instead — and include that sentence in your summary.

### Rule 2 — Schema Changes Must Link to Code

- Never hand-write a new interface for a database table. Use the generated `Database` type from Supabase type generation.
- After writing a migration, regenerate database types in the same commit — not as a follow-up.
- If a migration renames or drops a column, grep the entire repo for that column name before considering the migration done.
- Before adding an index, check whether one already exists: `grep -rn "CREATE INDEX.*tablename" supabase/migrations/`.

### Rule 3 — Every New Route Ships With a Test

- A new API route is not "done" until it has a colocated test at `app/api/*/[route]/__tests__/route.test.ts`.
- If the route calls an external service (Gemini, Vertex AI, Document AI, Supabase), the test must include at least one failure-mode case — not just the happy path.
- If the route reads a body, query string, or form data, it must validate input with Zod using `.safeParse()`. The `scripts/check-api-schemas.sh` CI check enforces this — don't work around it, fix the route.
- Any `useEffect` that fetches data must include `AbortController` cleanup.

### Rule 4 — Don't Inflate Coverage Numbers

- Never write a test whose only purpose is to touch a line for coverage credit. Every test must assert something meaningful.
- UI primitives in `components/ui/**` (shadcn/Radix wrappers) should be excluded from the coverage threshold in `vitest.config.ts` — don't write tests against them just to boost numbers.
- Finance, auth, security, and AI-generation code must be held to a materially higher bar than the global average.

### Rule 5 — CI Gates Must Be Able to Actually Fail

- When adding error-handling or fallback logic to a CI step, scope it to the specific failure it's meant to catch — not a blanket `|| exit 0` that also swallows real errors.
- If a CI job hasn't failed in a long time, treat that as a signal to check whether it can still actually fail.

### Rule 6 — Generate What Can Be Generated; Don't Hand-Maintain It

- If a doc's content is mechanically derivable from code (API routes → OpenAPI spec, migrations → schema doc, `process.env.X` usages → `.env.example`), write or use a script that generates it, not hand-edited prose.
- Every new env var used in code must be added to `.env.example` with a one-line comment in the same commit.
- Never commit a document with unfilled `[FILL IN]` placeholders as if it's complete — either fill it in or clearly mark it as a draft.

### Rule 7 — No Scratch Work in the Repo

- Never commit a one-off debugging or scratch script. If it's reusable, put it in `scripts/` with a clear name and a comment explaining when to run it.
- Before finishing a task, check for anything that looks like local scratch work, generated output (`coverage/`, `.next/`, IDE config), or a duplicate of an existing file — `.gitignore` or remove it before committing.
- Files like `scratch.ts`, `scratch2.ts`, `test-vertex.js`, `test-query.js` at the repo root are violations of this rule and should be removed or moved to `scripts/`.

### Rule 8 — One Canonical Location Per Concern

- Route-specific server actions (used by exactly one page) go in `app/`.
- Cross-cutting business logic (used by multiple routes/features) goes in `features/`.
- When unsure, default to `features/` — it's easier to consolidate later.

### Rule 9 — Never Write a Test That Can't Fail

- Every test must contain an assertion that could plausibly fail given a real bug. `expect(true).toBe(true)` is a bug, not a test.
- If a capability can't be tested yet, mark it `.todo()` or `.skip()` with a comment explaining why — don't write a structurally un-failble assertion instead.
- A test file whose name promises more than its body checks (e.g. "zero-downtime deployment" that checks nothing about deployment) is a bug to fix.

### Rule 10 — List Endpoints Must Be Bounded

- Any new route returning a list of rows must use `.range()` or `.limit()` — never return an unbounded result set.
- Use an explicit column list in `.select()` instead of `"*"` unless every column is genuinely needed.
- Any route accessible without an admin role that returns public-facing data should have rate limiting applied — check `lib/rate-limit.ts` for the existing pattern.

### Rule 11 — Don't Let Files Grow Past ~500 Lines

- If a file you're editing is already over ~500 lines, or your change would push it there, split it before adding more — extract a hook, break a multi-step form into per-step components, or move logic to its own file.
- Prefer several small, single-purpose files over one file that does everything for a page.

### Rule 12 — Never Swallow an Error Silently

- Every `catch` block in a route handler must either call `handleApiError` or explicitly return an error response — never just log and fall through to a success path.
- Never use `console.log`/`console.error` directly in application code — use `lib/logger.ts` for structured output.
- An empty `catch {}` is only acceptable for fire-and-forget calls (e.g. analytics pings) — and even then, add a comment saying so explicitly.

### Rule 13 — Loading and Error States Are Mandatory

- Any new top-level route segment under `app/dashboard/` should have its own `loading.tsx` if it fetches data on load.
- If a route segment can meaningfully fail independently (e.g. it calls an external API), give it its own `error.tsx` rather than relying on a distant parent boundary.

### Rule 14 — Naming Must Avoid Collisions

- Before naming a new test/config directory, check whether the name is already used elsewhere in the repo for something different (e.g. `__tests__/e2e/` vs `e2e/` using two different test runners).
- Follow the migration filename pattern exactly: `YYYYMMDDHHMMSS_description.sql`. Don't introduce alternate schemes.

### Rule 15 — Operational Docs Must Be Actually Usable

- If you touch a runbook or operational doc, check it for `[FILL IN]` placeholders before moving on — a runbook with placeholders is not done.
- When adding a new operational capability (cron job, external service), add a line to the relevant runbook: how to check its health and who/what to contact if it fails.

### Rule 16 — Write an ADR When Making a Real Architectural Decision

- If a change involves choosing between two real technical approaches, write a short ADR in `docs/adr/` in the same PR — a few sentences on alternatives considered and why one won is enough.
- Number ADRs sequentially. Never renumber or delete old ones — mark superseded ones as "Superseded by 000X."

### Rule 17 — Never Assert a Number or Claim in Prose That Nothing Enforces

- Don't write a specific percentage or completeness claim in a doc or README unless something in CI would fail if it stopped being true.
- Before adding a badge (coverage, build status), confirm it's wired to a live source — not a static image asserting a number.

### Rule 18 — SECURITY.md Must Stay Current

- `SECURITY.md` must exist at the repo root and describe how to report a vulnerability privately.
- If the reporting contact changes, update `SECURITY.md` in the same PR that changes it.

### Rule 19 — Complex Systems Need Diagrams, Not Just Prose

- When documenting a system with multiple moving parts, include a Mermaid diagram rather than prose alone. Mermaid renders natively in GitHub markdown.
- Maintain one up-to-date high-level architecture diagram showing major services and how they connect.

### Rule 20 — New Docs Must Be Discoverable

- Maintain a `docs/README.md` index linking every doc by category. When adding a new doc, add its link in the same PR.
- Never let a doc exist only as a filename someone has to already know to find.

### Rule 21 — Check Generated Doc Output for Corruption

- If a script or agent writes to a doc automatically, spot-check the actual output for corruption (stray control characters, encoding artifacts) — not just that the script exited successfully.
- Prefer writing generated text to a file directly over shell string concatenation with special characters, which is the likely source of control-character corruption bugs.
