-- Sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid NOT NULL REFERENCES public.tutors(id) ON DELETE CASCADE,
  learner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scheduled_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  specialization_id uuid REFERENCES public.specializations(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Session ratings
CREATE TABLE IF NOT EXISTS public.session_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL UNIQUE REFERENCES public.sessions(id) ON DELETE CASCADE,
  learner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for sessions
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Learners can create sessions
CREATE POLICY "sessions_insert_learner" ON public.sessions
  FOR INSERT WITH CHECK (auth.uid() = learner_id);

-- Learners can read their own sessions
CREATE POLICY "sessions_select_learner" ON public.sessions
  FOR SELECT USING (auth.uid() = learner_id);

-- Tutors can read sessions assigned to them
CREATE POLICY "sessions_select_tutor" ON public.sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tutors t WHERE t.id = tutor_id AND t.user_id = auth.uid()
    )
  );

-- Tutors can update sessions assigned to them
CREATE POLICY "sessions_update_tutor" ON public.sessions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.tutors t WHERE t.id = tutor_id AND t.user_id = auth.uid()
    )
  );

-- Learners can update their own sessions (e.g., cancel)
CREATE POLICY "sessions_update_learner" ON public.sessions
  FOR UPDATE USING (auth.uid() = learner_id);

-- Admins can do everything
CREATE POLICY "sessions_admin_all" ON public.sessions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid() AND r.name = 'administrator'
  )
);

-- RLS for session_ratings
ALTER TABLE public.session_ratings ENABLE ROW LEVEL SECURITY;

-- Learners can insert their own ratings
CREATE POLICY "ratings_insert_learner" ON public.session_ratings
  FOR INSERT WITH CHECK (auth.uid() = learner_id);

-- Everyone can read ratings
CREATE POLICY "ratings_select_all" ON public.session_ratings
  FOR SELECT USING (true);

-- Admins full access
CREATE POLICY "ratings_admin_all" ON public.session_ratings FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid() AND r.name = 'administrator'
  )
);
