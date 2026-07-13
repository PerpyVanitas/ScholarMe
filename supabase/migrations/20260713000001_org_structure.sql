-- ============================================================
-- Migration: Org Terms & Assignments
-- Created: 2026-07-13
-- Purpose: Tracks academic-year org officer assignments
--          that expire every June 30.
-- ============================================================

-- 1. Org Terms — one row per academic year
CREATE TABLE IF NOT EXISTS org_terms (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label       text NOT NULL,           -- e.g. "A.Y. 2026-2027"
  term_start  date NOT NULL,           -- typically July 1
  term_end    date NOT NULL,           -- typically June 30
  is_current  boolean NOT NULL DEFAULT false,
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now()
);

-- Only one term can be current at a time
CREATE UNIQUE INDEX IF NOT EXISTS one_current_term
  ON org_terms (is_current)
  WHERE is_current = true;

-- 2. Org Assignments — who holds what position in a given term
CREATE TABLE IF NOT EXISTS org_assignments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term_id      uuid NOT NULL REFERENCES org_terms(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position     text NOT NULL,
  -- Executive positions: 'president','vice_president','secretary','treasurer','auditor'
  -- Committee positions: 'committee_head','assistant_committee_head'
  committee    text,
  -- For committee positions, which committee they lead (null for executives)
  -- e.g. 'Secretariat', 'COF', 'CIA', 'CMSS', 'CPR', 'CRAR', 'COD', 'CFMR', 'COR', 'CKA'
  --      'CHR', 'COM', 'CEP', 'CNL', 'CMP', 'CBAMM', 'COI'
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now(),

  -- Enforce one person per position/committee per term
  UNIQUE (term_id, position, committee)
);

-- Enable Row Level Security
ALTER TABLE org_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_assignments ENABLE ROW LEVEL SECURITY;

-- RLS: Everyone can read org terms and assignments (public org info)
CREATE POLICY "org_terms_public_read" ON org_terms
  FOR SELECT USING (true);

CREATE POLICY "org_assignments_public_read" ON org_assignments
  FOR SELECT USING (true);

-- RLS: Only super_admin (via service role) can write
-- (All writes go through the API route which uses service role key)
CREATE POLICY "org_terms_service_write" ON org_terms
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "org_assignments_service_write" ON org_assignments
  FOR ALL USING (auth.role() = 'service_role');

-- 3. Add org_assignment_id to profiles for quick profile display lookups
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS org_assignment_id uuid REFERENCES org_assignments(id) ON DELETE SET NULL;

-- 4. Partial unique index: enforce only one super_admin at a time
-- (Requires roles table to exist with a 'super_admin' name entry)
-- This is a deferred constraint — the actual enforcement is done at API level
-- because Postgres partial indexes on JOINs aren't directly supported.
-- Instead we add a DB function + trigger:

CREATE OR REPLACE FUNCTION enforce_single_super_admin()
RETURNS TRIGGER AS $$
DECLARE
  super_admin_role_id uuid;
  existing_count int;
BEGIN
  -- Get super_admin role id
  SELECT id INTO super_admin_role_id FROM roles WHERE name = 'super_admin';

  IF NEW.role_id = super_admin_role_id THEN
    -- Count existing super_admins excluding the row being updated
    SELECT COUNT(*) INTO existing_count
    FROM profiles
    WHERE role_id = super_admin_role_id
      AND id != NEW.id;

    IF existing_count > 0 THEN
      RAISE EXCEPTION 'Only one super_admin account may exist at a time.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_single_super_admin ON profiles;
CREATE TRIGGER trg_enforce_single_super_admin
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION enforce_single_super_admin();

-- 5. Seed the current A.Y. term if none exists yet
INSERT INTO org_terms (label, term_start, term_end, is_current)
SELECT 'A.Y. 2026-2027', '2026-07-01', '2027-06-30', true
WHERE NOT EXISTS (SELECT 1 FROM org_terms WHERE is_current = true);
