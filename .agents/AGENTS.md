# ScholarMe Project Rules

## CHANGELOG Management

- **Always Read the Changelog:** At the start of every new chat or when investigating the state of the project, you MUST read the `docs/CHANGELOG.md` file located in the workspace to understand recent updates.
- **Always Update the Changelog:** Whenever you complete a feature, fix a bug, or make significant changes to the codebase, you MUST append a detailed entry to `docs/CHANGELOG.md` before finishing your task. Format it cleanly with the date and a summary of what was accomplished.

## Task Iteration

- **Continuous Phase Execution:** Whenever a user gives a large task that is broken down into phases, routinely check if there are still tasks or things that are unimplemented. Continue iterating until the entire backlog is finished. Once finished, do a final check if everything has been implemented before reporting the walkthrough and ending the iteration.

## Cycle End Requirements: Documentation Maintenance

At the end of every instruction implementation cycle (e.g., when finishing a task, fixing a bug, or implementing a new feature), you MUST maintain and review these documentation files:

- **docs/map.md**: This file contains a comprehensive list of all possible interactions a user has. You must review this list to ensure all interactions are still working according to expectations.
- **docs/schema.md**: This file contains the current expected version of the database schema. You must keep this updated so it can be easily compared against the actual schema in the database.
- **docs/rbac.md**: This file contains the authoritative access control rules. Keep it updated if roles change.

Always review and update these documentation files before concluding your work and presenting the final walkthrough.

## Cycle End Requirements: Git Hygiene & .gitignore Audit

At the end of every instruction implementation cycle (before finalizing your work or reporting completion):
1. **Run `git status`**: Inspect all untracked files, modified files, and generated output.
2. **Audit Scratch & Generated Files**: Identify any scratch scripts (`scratch*.ts`, one-off debug scripts), temporary test/build artifacts, or generated log files.
3. **Update `.gitignore` with Category Labels**: If untracked files should not be committed to source control, append them to `.gitignore` using wildcard patterns (e.g. `scratch*.ts`, `*.log`) under a clear, descriptive section comment (e.g. `# Scratch & Temporary Debugging Files`).
4. **Verify Clean Workspace**: Confirm `git status` reflects only intended, tracked changes before completing the turn.

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

## Development Guardrails (Repo-Specific) — AI Development Ruleset v2

Every rule here traces back to a specific, real problem found in this repo — not generic best practice. Treat a violation of any rule here the same as a failing test.

---

### Category A. Before you build anything

#### A1. Check if it already exists before creating it
- Before creating a new file, utility, type, or feature, search the repo for an existing one that does the same job under a different name — not just the obvious location.
- Before proposing a new feature in a planning/audit conversation, verify it isn't already implemented — check the actual route/component tree, don't infer from memory of an earlier pass.
- If something similar already exists, extend or reuse it. Only build a parallel version if you can state in one sentence why the existing one can't be modified — and put that sentence in the commit message.

#### A2. Verify claims about system state before acting on them
- When another AI session or agent reports "X is done" or "the cause is Y," verify against the actual repository/system state before repeating the claim or building on top of it.
- A dramatic-sounding root cause (disk corruption, physical hardware failure) deserves more scrutiny than a mundane one (a locked file handle, a path length limit) — the mundane explanation is usually right.

---

### Category B. Data & schema integrity

#### B1. Schema changes need a mechanical link to the code that depends on them
- Never hand-write a new interface for a database table — use a generated `Database` type once the generation step exists.
- After writing a migration, regenerate database types in the same commit, not as a follow-up.
- If a migration renames or drops a column, grep the whole repo for that column name before considering the migration done.
- Before adding an index, check whether an equivalent one already exists under a different name (`grep -rn "CREATE INDEX.*tablename" supabase/migrations/`).

#### B2. List endpoints must be bounded, selective, and rate-limited where needed
- Any route returning a list of rows must use `.range()`/`.limit()` — never return an unbounded result set.
- Use an explicit column list instead of `.select("*")` unless every column is genuinely needed, especially in list/index routes.
- Any route accessible without an admin role that returns write-heavy or public-facing data should have rate limiting — check `lib/rate-limit.ts` for the existing pattern.

#### B3. Don't let unused schema accumulate
- When a feature is redesigned or abandoned mid-build, drop the unused tables/columns in the same PR rather than leaving them as silent dead weight.
- Before flagging a table as "dead" during an audit, search the *entire* codebase including `components/` — a narrower search has produced false positives.

---

### Category C. Testing discipline

#### C1. Every new route ships with a test in the same commit
- A new API route isn't done until it has a colocated test, following the pattern in `app/api/*/[route]/__tests__/route.test.ts`.
- If the route calls an external service (Gemini, Vertex AI, Document AI, Supabase), include at least one failure-mode test (timeout, 500, malformed response) — follow the pattern in `__tests__/resilience/ai-tutor.test.ts`.
- If the route reads a body, query string, or form data, validate with Zod and `.safeParse()` — `scripts/check-api-schemas.sh` already enforces this in CI.
- Any `useEffect` that fetches data must include `AbortController` cleanup — a recurring root cause of "page sometimes doesn't load" bugs.

#### C2. Coverage numbers must reflect real testing, not be gamed
- Never write a test whose only purpose is to touch a line for coverage credit — every test needs an assertion that could plausibly fail given a real bug. A test file whose name promises more than its body checks is a bug to fix.
- If a capability isn't implemented yet or can't be tested in the current environment, mark the test `.todo()`/`.skip()` with a comment explaining why — don't write an assertion structurally incapable of failing.
- UI primitives in `components/ui/**` shouldn't count toward the coverage threshold — exclude them in `vitest.config.ts` rather than writing shallow tests against them.
- If a coverage threshold change is needed, state explicitly in the PR why the number is changing — don't silently bump it.
- Finance, auth, security, and AI-generation code should be held to a materially higher bar than the global average.

#### C3. Comprehensive Table Coverage in Supabase Unit Test Mocks
- When modifying server actions or routes that fetch auxiliary table data (e.g. `profiles` for submitter metadata, `finance_compliance_flags` for deadlines), update corresponding unit test mocks (`mockSupabase.from`) to handle all queried table names.
- Supabase test mocks should either explicitly handle each queried table or provide a safe chainable default mock (`select().eq().single()`) to prevent `TypeError: supabase.from(...).select is not a function` during test runs.

---

### Category D. CI/CD must be trustworthy

#### D1. A gate that can't fail isn't a gate
- When adding error-handling/fallback logic to a CI step, scope it to the specific failure it's meant to catch — never a blanket catch-all that also swallows the thing you're trying to detect.
- If a CI job hasn't failed in a long time, treat that as a prompt to verify it's still actually capable of failing.

#### D2. Deployment safety nets need to be real, not documented-only
- Any claim of a deployment safety mechanism (staging gate, canary, rollback) needs to be enforced in the pipeline, not just documented in a runbook.
- If a genuine capability doesn't exist yet, say so plainly rather than writing a test or doc section that implies it does.

---

### Category E. Documentation

#### E1. Generate what's derivable from code — don't hand-maintain it
- If a doc's content is mechanically derivable from code (routes → OpenAPI spec, migrations → schema doc, env var usage → `.env.example`), write a generator script and wire it into CI so a mismatch fails the build.
- Never write a specific number, percentage, or completeness claim in a doc/README unless something in CI actually checks and would fail if it stopped being true.
- If a script or agent writes to a doc automatically, spot-check the committed output for corruption — prefer direct file writes over shell string concatenation with special characters.
- Every new env var used in code must be added to `.env.example` with a one-line comment, in the same commit.

#### E2. Operational and policy docs must stay usable, not just present
- Never leave a document with unfilled placeholders (`[FILL IN]`) committed as if complete — fill it in or mark it clearly as a draft.
- When making a real architectural decision, write a short ADR in `docs/adr/` in the same PR. Number sequentially, never delete an old one — mark it "Superseded by 000X" instead.
- Keep `SECURITY.md` current — if the vulnerability-reporting contact changes, update it in the same PR.
- Document systems with more than a handful of moving parts using a Mermaid diagram, not prose alone.
- Maintain a `docs/README.md` index linking every doc by category — add a new doc's link in the same PR that adds the doc.
- When adding a new operational capability (a cron job, an external service dependency), add a line to the relevant runbook for how to check its health and who to contact if it fails.

---

### Category F. Repo & code hygiene

#### F1. Don't commit scratch work or let files grow unreadable
- Never commit a one-off debugging/scratch script — if a reusable version is worth keeping, put it in `scripts/` with a clear name.
- **End-of-Run .gitignore Audit**: On the final portion of every run, run `git status` to check for scratch work, generated logs, or temporary test output. Add any untracked items to `.gitignore` with clear category labels/comments (`# Scratch Files`, `# Local Test Artifacts`), using wildcard patterns over exact filenames.
- If a file you're editing is already over ~500 lines, or your change would push it there, split it before adding more.

#### F2. One canonical location per concern, one naming scheme
- Route-specific server actions go in `app/`; cross-cutting business logic goes in `features/`. If unsure, default to `features/`.
- Before naming a new top-level directory, check whether the name is already used elsewhere for something different — pick something unambiguous on its own.
- Follow the existing migration filename pattern (`YYYYMMDDHHMMSS_description.sql`) exactly.

#### F3. Canonical documentation directory is `docs/`
- All documentation, runbooks, schemas, and changelogs MUST reside strictly in `docs/` (e.g. `docs/CHANGELOG.md`, `docs/map.md`, `docs/schema.md`).
- NEVER create or write to a top-level `documentation/` directory. If found, merge its contents into `docs/` and remove the directory immediately.

---

### Category G. Error handling & resilience

#### G1. Never swallow an error silently, and give every failure a boundary
- Every `catch` in a route handler must call the shared `handleApiError` helper or explicitly return an error response — never log and fall through to a success path.
- Use the shared logger (`lib/logger.ts`), never raw `console.log`/`console.error`, in application code.
- An empty `catch {}` is only acceptable for genuinely fire-and-forget calls (best-effort analytics), and even then needs a comment saying so.
- Any new top-level route segment that fetches data on load should have its own `loading.tsx`. Any route segment that can fail independently of its parent should have its own `error.tsx`.

---

### Category H. UI & navigation consistency

#### H1. A button's icon, label, and destination must all agree
- When a UI element (nav item, button) branches its destination conditionally (by role, by state), the icon and label must be re-evaluated for that branch too — don't just swap the `href` and leave a stale icon/label from the other branch.
- Never reuse the same icon for two destinations within the same visible section/list — if scanning a page and two things look identical, the icon isn't doing its job.
- Before wiring a button's destination, ask what a user would expect it to do based on its label and icon alone — if the actual behavior wouldn't match a naive guess, either change the behavior or change the label.

#### H2. No duplicate routes, no orphaned pages
- Before creating a new route, check whether an existing route already renders the same component with the same data — if so, redirect to the canonical one instead of maintaining two copies.
- Every real, user-facing page must be reachable from somewhere — nav, a parent page's internal links, or a dropdown menu.
- When auditing for orphaned pages, verify against every discovery path before flagging.

#### H3. Destructive actions require confirmation; reversible ones can use undo instead
- Any delete/remove action must go through a confirmation dialog before executing — reuse the existing `AlertDialog` pattern already implemented correctly in `user-delete-dialog.tsx`.
- For lower-stakes, easily-reversible actions (archiving, leaving a group, dismissing a notification), prefer a toast-with-undo over a blocking confirmation dialog.

#### H4. Unified creation for shared data structures
- When two features share identical database tables (e.g. `study_sets` and `study_set_items`), consolidate creation sheets, item editors, and import utilities around the unified data layer.
- Study experience (Flashcards, Test, Learn) should be a post-creation mode choice rendered on the set page rather than requiring separate creation UIs.

#### H5. UI Reachability Guardrail for Actions and Workflows
- A backend server action, dialog component, or financial workflow (e.g. `requestPettyCashReplenishment()`, COI modals, approval dialogs) isn't done until it is demonstrably reachable from a real page UI in `app/`.
- Never consider a feature complete if the server logic exists but no button or form on any page actually triggers it. Always wire the UI trigger in the same commit.

---

### Category I. Security baseline

#### I1. MFA and session visibility for sensitive roles
- When adding or touching auth flows, treat MFA (via Supabase Auth's built-in support) as the default expectation for admin and finance-role accounts, not an optional nice-to-have.
- A "Devices & Sessions" self-service view is a security control, not just a QoL feature — treat it with the same priority as other auth work.

#### I2. Don't downgrade a working security or validation gate to make a build pass
- If a CI security gate (dependency audit, secret scan, schema validation) is blocking a merge, fix the actual issue it's flagging — never loosen the gate itself as a shortcut.

#### I3. Strict Anti-Self-Approval & Anti-Self-Auditing Controls
- In financial, approval, or auditing workflows, role checks alone (`administrator`, `super_admin`, `finance_manager`) are NOT sufficient to authorize a mutation.
- Every server action or API handler approving budgets, releasing funds, authorizing petty cash, or co-signing audit reports MUST perform an explicit identity check comparing `user.id` against `submitted_by` / `prepared_by`.
- If `existing.submitted_by === user.id` or `existing.prepared_by === user.id`, the action MUST be rejected with a policy error, regardless of the user's role tier.

---

### Category J. Performance & caching

#### J1. Cache read-heavy, low-churn responses
- When building or touching a route that serves shared, infrequently-changing data, add appropriate `Cache-Control`/`revalidate` headers.
- Never cache anything user-specific or frequently-mutating (finance, messages, timesheets) — this rule is specifically for shared, low-churn reads.

---

### Category K. Code logic & precedence

#### K1. Parenthesize ternary expressions when combined with logical OR
- When using logical OR (`||`) with a conditional ternary operator (`? :`) for property fallback logic, ALWAYS parenthesize the ternary expression:
  ```ts
  // CORRECT:
  type: item.type || (derivedType === "mixed" ? "multiple_choice" : derivedType)
  
  // INCORRECT (evaluates as (item.type || derivedType === "mixed") ? ... which overwrites valid truthy item.type values):
  type: item.type || derivedType === "mixed" ? "multiple_choice" : derivedType
  ```


