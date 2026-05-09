-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'system' CHECK (type IN ('session', 'system', 'resource')),
  is_read boolean NOT NULL DEFAULT false,
  link text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update (mark read) their own notifications
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins can insert notifications for anyone
CREATE POLICY "notifications_admin_insert" ON public.notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.name = 'administrator'
    )
  );

-- System can insert notifications (via service role, not covered by RLS)
-- Allow users to insert notifications for themselves (for system-generated)
CREATE POLICY "notifications_insert_own" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);
