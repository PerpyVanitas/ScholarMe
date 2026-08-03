-- Migration: User blocking system + fast full-name search index
-- ─────────────────────────────────────────────────────────────

-- 1. Enable pg_trgm for fast ILIKE searches on full_name
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. GIN trigram index on profiles.full_name for sub-100ms ILIKE
CREATE INDEX IF NOT EXISTS idx_profiles_full_name_trgm
  ON public.profiles USING GIN (full_name gin_trgm_ops);

-- 3. user_blocks table
CREATE TABLE IF NOT EXISTS public.user_blocks (
  blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id),
  CONSTRAINT no_self_block CHECK (blocker_id <> blocked_id)
);

-- 4. Index for fast "who has this user blocked?" lookups
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked_id
  ON public.user_blocks (blocked_id);

-- 5. RLS: users can only manage and view their own blocks
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

-- Drop first so re-running the migration is idempotent
DROP POLICY IF EXISTS "Users can see their own blocks"   ON public.user_blocks;
DROP POLICY IF EXISTS "Users can insert their own blocks" ON public.user_blocks;
DROP POLICY IF EXISTS "Users can delete their own blocks" ON public.user_blocks;

CREATE POLICY "Users can see their own blocks"
  ON public.user_blocks FOR SELECT
  USING (auth.uid() = blocker_id);

CREATE POLICY "Users can insert their own blocks"
  ON public.user_blocks FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete their own blocks"
  ON public.user_blocks FOR DELETE
  USING (auth.uid() = blocker_id);
