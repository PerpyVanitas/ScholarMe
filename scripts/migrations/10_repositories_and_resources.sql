CREATE TABLE IF NOT EXISTS public.repositories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  access_role text NOT NULL DEFAULT 'all' CHECK (access_role IN ('all', 'tutor', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id uuid NOT NULL REFERENCES public.repositories(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  url text NOT NULL,
  file_type text,
  uploaded_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
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