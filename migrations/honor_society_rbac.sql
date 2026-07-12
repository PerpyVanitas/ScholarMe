-- Migration: Honor Society RBAC & Organizational Overhaul
-- Adds fields to support the official constitutional structure.

-- 1. Add fields to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS membership_classification text DEFAULT 'learner' CHECK (membership_classification IN ('learner', 'regular_member', 'esas_scholar')),
ADD COLUMN IF NOT EXISTS committee text,
ADD COLUMN IF NOT EXISTS service_hours_balance integer DEFAULT 0;

-- 2. Ensure new roles exist in the roles table
-- Note: Requires `roles` table to have a UNIQUE constraint on `name`.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'roles_name_key') THEN
        ALTER TABLE roles ADD CONSTRAINT roles_name_key UNIQUE (name);
    END IF;
END $$;

INSERT INTO roles (name) VALUES
('vice_president'),
('secretary'),
('assistant_committee_head')
ON CONFLICT (name) DO NOTHING;

-- 3. We'll map the roles via the UI/application logic, so the DB changes are minimal.
