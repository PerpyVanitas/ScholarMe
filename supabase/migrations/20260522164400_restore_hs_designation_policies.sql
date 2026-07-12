SET statement_timeout = 0;
-- =============================================
-- Restore User Policies on hs_designations
-- =============================================

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

