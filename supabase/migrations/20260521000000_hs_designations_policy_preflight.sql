SET statement_timeout = 0;
-- Preflight: make hs_designations policy creation idempotent for preview/re-runs
-- This runs BEFORE 20260521001000_hs_designations.sql (lexicographic order).

DROP POLICY IF EXISTS "Users can view own designations" ON public.hs_designations;
DROP POLICY IF EXISTS "Users can insert own designations" ON public.hs_designations;
DROP POLICY IF EXISTS "Users can update own designations" ON public.hs_designations;
DROP POLICY IF EXISTS "Users can delete own designations" ON public.hs_designations;
DROP POLICY IF EXISTS "Admins can manage all designations" ON public.hs_designations;

