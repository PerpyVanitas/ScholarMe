-- Resource repositories
CREATE TABLE IF NOT EXISTS public.repositories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  access_role text NOT NULL DEFAULT 'all' CHECK (access_role IN ('all', 'tutor', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Resources within repositories
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

-- RLS for repositories
ALTER TABLE public.repositories ENABLE ROW LEVEL SECURITY;

-- Everyone can read repos with access_role = 'all'
CREATE POLICY "repos_select_all_access" ON public.repositories
  FOR SELECT USING (access_role = 'all');

-- Tutors can read repos with access_role = 'tutor' or 'all'
CREATE POLICY "repos_select_tutor_access" ON public.repositories
  FOR SELECT USING (
    access_role IN ('all', 'tutor') AND
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.name IN ('tutor', 'administrator')
    )
  );

-- Admins can read all repos
CREATE POLICY "repos_admin_select_all" ON public.repositories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.name = 'administrator'
    )
  );

-- Owners can manage their repos
CREATE POLICY "repos_manage_own" ON public.repositories
  FOR ALL USING (auth.uid() = owner_id);

-- Admins can manage all repos
CREATE POLICY "repos_admin_manage" ON public.repositories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.name = 'administrator'
    )
  );

-- RLS for resources
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Read access based on parent repo access_role
CREATE POLICY "resources_select_via_repo" ON public.resources
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.repositories repo
      WHERE repo.id = repository_id
      AND (
        repo.access_role = 'all'
        OR (repo.access_role = 'tutor' AND EXISTS (
          SELECT 1 FROM public.profiles p
          JOIN public.roles r ON p.role_id = r.id
          WHERE p.id = auth.uid() AND r.name IN ('tutor', 'administrator')
        ))
        OR EXISTS (
          SELECT 1 FROM public.profiles p
          JOIN public.roles r ON p.role_id = r.id
          WHERE p.id = auth.uid() AND r.name = 'administrator'
        )
      )
    )
  );

-- Owners of repo can manage resources
CREATE POLICY "resources_manage_via_repo_owner" ON public.resources
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.repositories repo
      WHERE repo.id = repository_id AND repo.owner_id = auth.uid()
    )
  );

-- Admins can manage all resources
CREATE POLICY "resources_admin_manage" ON public.resources
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.name = 'administrator'
    )
  );
