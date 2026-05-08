CREATE TABLE IF NOT EXISTS public.specializations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  category text
);

CREATE TABLE IF NOT EXISTS public.tutors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  bio text,
  rating numeric(3,2) DEFAULT 0,
  total_ratings integer DEFAULT 0,
  hourly_rate numeric(10,2),
  years_experience integer,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.tutors
  ADD COLUMN IF NOT EXISTS hourly_rate numeric(10,2),
  ADD COLUMN IF NOT EXISTS years_experience integer,
  ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true;

CREATE TABLE IF NOT EXISTS public.tutor_specializations (
  tutor_id uuid REFERENCES public.tutors(id) ON DELETE CASCADE,
  specialization_id uuid REFERENCES public.specializations(id) ON DELETE CASCADE,
  PRIMARY KEY (tutor_id, specialization_id)
);

CREATE TABLE IF NOT EXISTS public.tutor_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid REFERENCES public.tutors(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.tutors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specializations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tutors_public_read" ON public.tutors;
CREATE POLICY "tutors_public_read" ON public.tutors FOR SELECT USING (true);
DROP POLICY IF EXISTS "tutors_own_write" ON public.tutors;
CREATE POLICY "tutors_own_write" ON public.tutors FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "tutor_spec_public_read" ON public.tutor_specializations;
CREATE POLICY "tutor_spec_public_read" ON public.tutor_specializations FOR SELECT USING (true);
DROP POLICY IF EXISTS "tutor_avail_public_read" ON public.tutor_availability;
CREATE POLICY "tutor_avail_public_read" ON public.tutor_availability FOR SELECT USING (true);
DROP POLICY IF EXISTS "tutor_avail_own_write" ON public.tutor_availability;
CREATE POLICY "tutor_avail_own_write" ON public.tutor_availability FOR ALL USING (
  EXISTS (SELECT 1 FROM public.tutors WHERE id = tutor_id AND user_id = auth.uid())
);
DROP POLICY IF EXISTS "specializations_public_read" ON public.specializations;
CREATE POLICY "specializations_public_read" ON public.specializations FOR SELECT USING (true);