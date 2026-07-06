-- Fix poll_options read policy to align with polls (hidden polls are not visible to non-admins)

DROP POLICY IF EXISTS "poll_options_public_read" ON public.poll_options;

CREATE POLICY "poll_options_authenticated_read" ON public.poll_options
  FOR SELECT TO authenticated USING (
    -- Admins and super_admins see everything
    public.is_admin(auth.uid())
    OR
    -- Non-admins only see options for non-hidden polls
    EXISTS (
      SELECT 1 FROM public.polls p
      WHERE p.id = poll_options.poll_id AND p.is_hidden = false
    )
  );
