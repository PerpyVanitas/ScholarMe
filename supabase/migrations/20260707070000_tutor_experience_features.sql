SET statement_timeout = 0;
-- Migration: 20260707070000_tutor_experience_features.sql
-- Description: Adds Tutor Experience features: meeting links, substitute tutors, calendar sync, auto-approve, peer reviews, strikes, mastery level.

-- Add missing columns to sessions
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS meeting_link text,
  ADD COLUMN IF NOT EXISTS substitute_tutor_id uuid REFERENCES public.tutors(id) ON DELETE SET NULL;

-- Add missing columns to tutors
ALTER TABLE public.tutors
  ADD COLUMN IF NOT EXISTS auto_approve_past_learners boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS calendar_sync_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS strikes integer DEFAULT 0;

-- Add mastery level to tutor_specializations
ALTER TABLE public.tutor_specializations
  ADD COLUMN IF NOT EXISTS mastery_level text DEFAULT 'standard';

-- Create tutor_peer_reviews table
CREATE TABLE IF NOT EXISTS public.tutor_peer_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id uuid NOT NULL REFERENCES public.tutors(id) ON DELETE CASCADE,
  reviewee_id uuid NOT NULL REFERENCES public.tutors(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback text,
  created_at timestamptz DEFAULT now()
);

-- RLS for tutor_peer_reviews
ALTER TABLE public.tutor_peer_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read peer reviews" ON public.tutor_peer_reviews
  FOR SELECT USING (true);

CREATE POLICY "Tutors can insert peer reviews" ON public.tutor_peer_reviews
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.tutors t WHERE t.id = reviewer_id AND t.user_id = auth.uid())
  );

