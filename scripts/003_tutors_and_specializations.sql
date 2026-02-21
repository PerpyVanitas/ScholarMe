-- Specializations
CREATE TABLE IF NOT EXISTS public.specializations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE
);

-- Seed common subjects
INSERT INTO public.specializations (name) VALUES
  ('Mathematics'),
  ('Science'),
  ('English'),
  ('History'),
  ('Computer Science'),
  ('Physics'),
  ('Chemistry'),
  ('Biology'),
  ('Literature'),
  ('Economics')
ON CONFLICT (name) DO NOTHING;

-- Tutors
CREATE TABLE IF NOT EXISTS public.tutors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  bio text,
  rating numeric NOT NULL DEFAULT 0,
  total_ratings int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tutor specializations join table
CREATE TABLE IF NOT EXISTS public.tutor_specializations (
  tutor_id uuid NOT NULL REFERENCES public.tutors(id) ON DELETE CASCADE,
  specialization_id uuid NOT NULL REFERENCES public.specializations(id) ON DELETE CASCADE,
  PRIMARY KEY (tutor_id, specialization_id)
);

-- Tutor availability slots
CREATE TABLE IF NOT EXISTS public.tutor_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid NOT NULL REFERENCES public.tutors(id) ON DELETE CASCADE,
  day_of_week int NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL
);

-- RLS for specializations (everyone can read)
ALTER TABLE public.specializations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "specializations_read_all" ON public.specializations FOR SELECT USING (true);

-- RLS for tutors
ALTER TABLE public.tutors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tutors_read_all" ON public.tutors FOR SELECT USING (true);
CREATE POLICY "tutors_insert_own" ON public.tutors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tutors_update_own" ON public.tutors FOR UPDATE USING (auth.uid() = user_id);

-- Admin can manage tutors
CREATE POLICY "tutors_admin_all" ON public.tutors FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid() AND r.name = 'administrator'
  )
);

-- RLS for tutor_specializations
ALTER TABLE public.tutor_specializations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tutor_specs_read_all" ON public.tutor_specializations FOR SELECT USING (true);
CREATE POLICY "tutor_specs_manage_own" ON public.tutor_specializations FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.tutors t WHERE t.id = tutor_id AND t.user_id = auth.uid()
  )
);
CREATE POLICY "tutor_specs_admin" ON public.tutor_specializations FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid() AND r.name = 'administrator'
  )
);

-- RLS for tutor_availability
ALTER TABLE public.tutor_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "availability_read_all" ON public.tutor_availability FOR SELECT USING (true);
CREATE POLICY "availability_manage_own" ON public.tutor_availability FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.tutors t WHERE t.id = tutor_id AND t.user_id = auth.uid()
  )
);
CREATE POLICY "availability_admin" ON public.tutor_availability FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid() AND r.name = 'administrator'
  )
);
