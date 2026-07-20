# Migration Rollback Runbook (P10-3)

> [!WARNING]
> Database migrations in ScholarMe run automatically on Vercel deployment (via Supabase GitHub Actions or `supabase db push`).

## 1. Rolling Back a Local Migration
If a migration fails locally or you need to undo it before pushing:

```bash
# Revert the last applied migration
npx supabase migration down

# Revert specific number of migrations
npx supabase migration down <num>
```

## 2. Rolling Back a Production Migration
Supabase does NOT currently support automated `down` migrations in production via CLI `db push`. You must roll back manually.

### Scenario A: Reversible Schema Change (e.g. Added a column)
1. Create a new migration file: `npx supabase migration new rollback_issue_123`
2. Write the SQL to drop the column/table.
3. Commit and push. The CI pipeline will apply the rollback.

### Scenario B: Destructive Change (Data Loss)
If a migration dropped a column or table containing critical data:
1. Immediately halt application traffic (e.g., set Vercel to maintenance mode or rollback Vercel deployment to previous commit).
2. Follow the [Database Backup & Restore Runbook](./backup-restore-runbook.md) to restore via PITR (Point-in-Time Recovery) to the minute *before* the bad migration was applied.
3. Revert the git commit containing the bad migration so it does not re-apply.

## 3. Writing Safe Migrations
To avoid needing rollbacks:
- Never use `DROP TABLE` or `DROP COLUMN` in a single deployment. Phase 1: deprecate/ignore in code. Phase 2: drop in DB weeks later.
- Always add columns as `NULLABLE` first. Backfill data. Then make `NOT NULL`.
- Test migrations locally with `npx supabase db reset` before pushing.
