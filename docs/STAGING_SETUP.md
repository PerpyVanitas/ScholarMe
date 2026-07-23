# Staging Environment Setup & Rollback Runbook

## Staging Environment

To safely test migrations and risky code before production, ScholarMe utilizes a dedicated Staging Environment.

### Setup Instructions
1. **Provision Staging Project:** Create a new Supabase project named `scholarme-staging`.
2. **Environment Variables:** Create a `.env.staging` file copying `.env.example`, but substituting the keys with your staging Supabase URL and keys.
3. **Vercel Configuration:** In Vercel, map the `Preview` environment variables to your staging Supabase project.
4. **Deploying Migrations:** Run `supabase db push --db-url $STAGING_DB_URL` to apply migrations to staging before merging to `main`.

## Rollback Runbook

If a migration causes a critical bug in production, follow these steps to rollback safely:

1. **Identify the bad migration:** Look at the `supabase_migrations.schema_migrations` table to find the offending version.
2. **Write a down migration:** Create a new SQL migration file (e.g., `2026xxxx_revert_bad_migration.sql`) containing the `DROP` or `ALTER` statements to reverse the changes. Do NOT manually execute SQL via the dashboard, always use version control.
3. **Push to Staging:** Apply the revert migration to the staging database and verify the system recovers.
4. **Deploy to Prod:** Merge the revert migration to `main` and let the CI pipeline push it to production.
5. **Data Recovery:** If data was lost, use Supabase Point-in-Time Recovery (PITR) from the dashboard to restore the database state to right before the bad deployment.
