-- Tutor Peer Review & Substitution Schema Update

-- 1. Add is_lead_tutor to tutors
ALTER TABLE public.tutors
  ADD COLUMN IF NOT EXISTS is_lead_tutor boolean DEFAULT false;

-- 2. Create tutor_reviews table
CREATE TABLE IF NOT EXISTS public.tutor_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id uuid NOT NULL REFERENCES public.tutors(id) ON DELETE CASCADE,
  tutor_id uuid NOT NULL REFERENCES public.tutors(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.sessions(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- RLS for tutor_reviews
ALTER TABLE public.tutor_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tutor_reviews_read" ON public.tutor_reviews
  FOR SELECT USING (true); -- Public or at least authenticated can read reviews (or we can restrict it to admins/tutor itself)
  
CREATE POLICY "tutor_reviews_insert" ON public.tutor_reviews
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.tutors WHERE id = reviewer_id)
  );

-- 3. Substitution & Rescheduling for sessions
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS transfer_to_tutor_id uuid REFERENCES public.tutors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reschedule_requested_date date,
  ADD COLUMN IF NOT EXISTS reschedule_requested_start time,
  ADD COLUMN IF NOT EXISTS reschedule_requested_end time;
