-- ============================================================
-- ScholarMe — Fix: roles table RLS
-- Run this in the Supabase SQL Editor IMMEDIATELY.
--
-- Root cause: the `roles` table likely has RLS enabled but no
-- SELECT policy, so authenticated users cannot read it.
-- This causes the profiles JOIN on roles(id, name) to silently
-- return null, making ALL users appear as "learner".
--
-- The roles table is non-sensitive (just id/name pairs like
-- "administrator", "tutor", "learner"). It should be readable
-- by all authenticated users.
-- ============================================================

-- Step 1: Enable RLS (idempotent if already enabled)
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Step 2: Allow any authenticated user to read all roles
-- (roles are not sensitive — they're just labels)
DROP POLICY IF EXISTS "roles_read_all_authenticated" ON roles;
CREATE POLICY "roles_read_all_authenticated" ON roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Step 3: Only admins can insert/update/delete roles
DROP POLICY IF EXISTS "roles_write_admin_only" ON roles;
CREATE POLICY "roles_write_admin_only" ON roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.name = 'administrator'
    )
  );

-- Verify: this should return your role rows if the fix worked
SELECT id, name FROM roles ORDER BY name;
