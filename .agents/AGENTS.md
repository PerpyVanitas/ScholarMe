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
