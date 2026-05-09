-- Analytics logs
CREATE TABLE IF NOT EXISTS public.analytics_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.analytics_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read analytics
CREATE POLICY "analytics_admin_select" ON public.analytics_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.name = 'administrator'
    )
  );

-- Allow inserts from authenticated users (logging their own actions)
CREATE POLICY "analytics_insert_auth" ON public.analytics_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
