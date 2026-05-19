CREATE TABLE IF NOT EXISTS public.analytics_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.analytics_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "analytics_admin_read" ON public.analytics_logs;
CREATE POLICY "analytics_admin_read" ON public.analytics_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p JOIN public.roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.name = 'administrator'
    )
  );

DROP POLICY IF EXISTS "analytics_own_insert" ON public.analytics_logs;
CREATE POLICY "analytics_own_insert" ON public.analytics_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());