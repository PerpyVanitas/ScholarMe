CREATE TABLE IF NOT EXISTS public.polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active',
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz NOT NULL,
  allow_multiple_votes boolean DEFAULT false,
  is_anonymous boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.poll_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_text text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(poll_id, user_id, option_id)
);

ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "polls_public_read" ON public.polls;
CREATE POLICY "polls_public_read" ON public.polls FOR SELECT USING (true);
DROP POLICY IF EXISTS "polls_admin_write" ON public.polls;
CREATE POLICY "polls_admin_write" ON public.polls FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid() AND r.name = 'administrator'
  )
);
DROP POLICY IF EXISTS "poll_options_public_read" ON public.poll_options;
CREATE POLICY "poll_options_public_read" ON public.poll_options FOR SELECT USING (true);
DROP POLICY IF EXISTS "user_votes_insert_own" ON public.user_votes;
CREATE POLICY "user_votes_insert_own" ON public.user_votes
  FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "user_votes_public_count" ON public.user_votes;
CREATE POLICY "user_votes_public_count" ON public.user_votes
  FOR SELECT USING (true);