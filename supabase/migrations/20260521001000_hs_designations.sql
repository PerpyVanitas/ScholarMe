SET statement_timeout = 0;
-- =============================================
-- Honor Society Designations Table Migration
-- =============================================
-- Stores current and past designations for each
-- Honor Society member (Member, ESAS Scholar, 
-- Officer, Administrator).
-- Officers store their position title in the
-- `position` column.
-- =============================================

CREATE TABLE IF NOT EXISTS public.hs_designations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  designation text NOT NULL CHECK (designation IN ('member', 'esas_scholar', 'officer', 'administrator')),
  position text,  -- e.g., 'President', 'Vice President' — only for 'officer' designation
  academic_year text NOT NULL,  -- e.g., '2024-2025'
  is_current boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Ensure only ONE current designation per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_hs_designations_current
  ON public.hs_designations (user_id)
  WHERE is_current = true;

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_hs_designations_user 
  ON public.hs_designations (user_id);

-- =============================================
-- Row Level Security
-- =============================================
ALTER TABLE public.hs_designations ENABLE ROW LEVEL SECURITY;

-- Users can view their own designations
CREATE POLICY "Users can view own designations"
  ON public.hs_designations FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own designations
CREATE POLICY "Users can insert own designations"
  ON public.hs_designations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own designations
CREATE POLICY "Users can update own designations"
  ON public.hs_designations FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own designations
CREATE POLICY "Users can delete own designations"
  ON public.hs_designations FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can manage all designations
CREATE POLICY "Admins can manage all designations"
  ON public.hs_designations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.name = 'administrator'
    )
  );

