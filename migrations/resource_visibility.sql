-- ScholarMe: Resource Visibility Migration
-- Run this in the Supabase SQL Editor

-- 1. Add is_public column to resources table (default true = all existing resources are public)
ALTER TABLE resources ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true;

-- 2. Add submitted_at to tutor_specializations for submission-based verification
ALTER TABLE tutor_specializations ADD COLUMN IF NOT EXISTS submitted_at timestamptz;

-- Note: After running this, tutors must explicitly click 'Submit for Verification'
-- to set submitted_at = now(). Admin verifications page will filter by submitted_at IS NOT NULL.
