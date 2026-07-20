# Database Backup & Restore Runbook (P10-2)

> [!CAUTION]
> Restoring a backup overwrites live production data. Always test restores on a staging project first if the incident allows.

## 1. Automated Daily Backups
Supabase (Pro plan) automatically takes daily backups and supports Point-in-Time Recovery (PITR).

To restore from a daily automated backup:
1. Go to **Supabase Dashboard** -> **Project Settings** -> **Database** -> **Backups**.
2. Select the desired restore point.
3. Click **Restore**.
4. The database will be unavailable for ~2-5 minutes during the restore process.

## 2. Taking a Manual Logical Backup (pg_dump)

If you are migrating projects or need a snapshot before a risky operation:

```bash
# Export schema only
pg_dump --schema-only -h aws-0-[REGION].pooler.supabase.com -p 6543 -d postgres -U postgres.[PROJECT_REF] > schema_backup.sql

# Export data only
pg_dump --data-only -h aws-0-[REGION].pooler.supabase.com -p 6543 -d postgres -U postgres.[PROJECT_REF] > data_backup.sql
```

## 3. Restoring a Logical Backup (psql)

```bash
# Restore schema
psql -h aws-0-[REGION].pooler.supabase.com -p 6543 -d postgres -U postgres.[PROJECT_REF] < schema_backup.sql

# Restore data
psql -h aws-0-[REGION].pooler.supabase.com -p 6543 -d postgres -U postgres.[PROJECT_REF] < data_backup.sql
```

## 4. Recovering from Accidental Deletion (Soft Deletes)
Most ScholarMe tables (e.g. `profiles`, `sessions`) do NOT use soft deletes at the database level to maintain referential integrity.
If an admin accidentally deletes a user from the UI:
1. Identify the deleted user's `id` from Sentry or API logs.
2. If PITR is enabled, use the Supabase SQL Editor to query the deleted row from a past timestamp:
   ```sql
   SELECT * FROM profiles FOR SYSTEM_TIME AS OF '2024-01-01 10:00:00-00';
   ```
3. Re-insert the recovered row.
