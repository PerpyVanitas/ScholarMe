-- Preflight: avoid duplicate-policy failures in 20260522_restore_hs_designation_policies.sql
-- This runs BEFORE 20260522_restore_hs_designation_policies.sql (lexicographic order).

DROP POLICY IF EXISTS "Users can insert own designations" ON public.hs_designations;
DROP POLICY IF EXISTS "Users can update own designations" ON public.hs_designations;
DROP POLICY IF EXISTS "Users can delete own designations" ON public.hs_designations;

