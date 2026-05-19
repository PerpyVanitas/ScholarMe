CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid REFERENCES public.tutors(id) ON DELETE SET NULL,
  learner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  specialization_id uuid REFERENCES public.specializations(id) ON DELETE SET NULL,
  scheduled_date date NOT NULL,
  start_time time,
  end_time time,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes text,
  cancellation_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS cancellation_reason text;

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sessions_learner_select" ON public.sessions;
CREATE POLICY "sessions_learner_select" ON public.sessions
  FOR SELECT USING (learner_id = auth.uid());

DROP POLICY IF EXISTS "sessions_learner_insert" ON public.sessions;
CREATE POLICY "sessions_learner_insert" ON public.sessions
  FOR INSERT WITH CHECK (learner_id = auth.uid());

DROP POLICY IF EXISTS "sessions_tutor_select" ON public.sessions;
CREATE POLICY "sessions_tutor_select" ON public.sessions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tutors WHERE id = tutor_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "sessions_tutor_update" ON public.sessions;
CREATE POLICY "sessions_tutor_update" ON public.sessions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.tutors WHERE id = tutor_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "sessions_admin_all" ON public.sessions;
CREATE POLICY "sessions_admin_all" ON public.sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.name = 'administrator'
    )
  );