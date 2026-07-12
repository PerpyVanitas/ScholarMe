SET statement_timeout = 0;
-- Migration: poll system fixes
-- 1. Add is_hidden column to polls
-- 2. Fix RLS: non-admins can't see hidden polls
-- 3. Add UPDATE and DELETE policies for admins

-- ── 1. Add is_hidden column ───────────────────────────────────────────────────
ALTER TABLE public.polls
  ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

-- ── 2. Fix SELECT RLS: replace unconditional read with hidden-aware filter ─────
DROP POLICY IF EXISTS "polls_public_read" ON public.polls;

-- Regular users only see non-hidden polls
DROP POLICY IF EXISTS "polls_authenticated_read" ON public.polls;
CREATE POLICY "polls_authenticated_read" ON public.polls
  FOR SELECT USING (
    -- Admins and super_admins see everything (including hidden)
    public.is_admin(auth.uid())
    OR
    -- Non-admins only see non-hidden polls
    is_hidden = false
  );

-- ── 3. Add UPDATE policy (admin only) ─────────────────────────────────────────
DROP POLICY IF EXISTS "polls_admin_update" ON public.polls;
CREATE POLICY "polls_admin_update" ON public.polls
  FOR UPDATE USING (
    public.is_admin(auth.uid())
  )
  WITH CHECK (
    public.is_admin(auth.uid())
  );

-- ── 4. Add DELETE policy (admin only) ─────────────────────────────────────────
DROP POLICY IF EXISTS "polls_admin_delete" ON public.polls;
CREATE POLICY "polls_admin_delete" ON public.polls
  FOR DELETE USING (
    public.is_admin(auth.uid())
  );

-- ── 5. poll_options: add UPDATE and DELETE policies ───────────────────────────
DROP POLICY IF EXISTS "poll_options_admin_update" ON public.poll_options;
CREATE POLICY "poll_options_admin_update" ON public.poll_options
  FOR UPDATE USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "poll_options_admin_delete" ON public.poll_options;
CREATE POLICY "poll_options_admin_delete" ON public.poll_options
  FOR DELETE USING (public.is_admin(auth.uid()));

