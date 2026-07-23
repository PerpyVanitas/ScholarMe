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
