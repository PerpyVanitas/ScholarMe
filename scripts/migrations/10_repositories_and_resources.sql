CREATE TABLE IF NOT EXISTS public.repositories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  tutor_id uuid REFERENCES public.tutors(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id uuid REFERENCES public.repositories(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  file_url text,
  file_type text,
  file_size integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "repositories_own_or_public" ON public.repositories;
CREATE POLICY "repositories_own_or_public" ON public.repositories
  FOR SELECT USING (owner_id = auth.uid() OR access_role = 'all');

DROP POLICY IF EXISTS "repositories_own_write" ON public.repositories;
CREATE POLICY "repositories_own_write" ON public.repositories
  FOR ALL USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "resources_repo_access" ON public.resources;
CREATE POLICY "resources_repo_access" ON public.resources
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.repositories r
      WHERE r.id = resources.repository_id
        AND (r.owner_id = auth.uid() OR r.access_role = 'all')
    )
  );