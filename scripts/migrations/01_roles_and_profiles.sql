CREATE TABLE IF NOT EXISTS public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE
);

INSERT INTO public.roles (name) VALUES ('administrator'), ('tutor'), ('learner')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid REFERENCES public.roles(id),
  full_name text NOT NULL DEFAULT '',
  first_name text,
  last_name text,
  email text NOT NULL DEFAULT '',
  avatar_url text,
  phone_number text,
  birthdate date,
  date_of_birth date,
  membership_number text,
  bio text,
  profile_completed boolean DEFAULT false,
  terms_accepted_at timestamptz,
  total_xp integer DEFAULT 0 NOT NULL,
  current_level integer DEFAULT 1 NOT NULL,
  profile_theme_color text DEFAULT 'default',
  degree_program text,
  year_level integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS total_xp integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS current_level integer DEFAULT 1 NOT NULL,
  ADD COLUMN IF NOT EXISTS profile_theme_color text DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS degree_program text,
  ADD COLUMN IF NOT EXISTS year_level integer;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_admin_select_all" ON public.profiles;
CREATE POLICY "profiles_admin_select_all" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.name = 'administrator'
    )
  );

DROP POLICY IF EXISTS "profiles_admin_update_all" ON public.profiles;
CREATE POLICY "profiles_admin_update_all" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.name = 'administrator'
    )
  );

DROP POLICY IF EXISTS "profiles_public_read_for_tutors" ON public.profiles;
CREATE POLICY "profiles_public_read_for_tutors" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tutors WHERE user_id = profiles.id)
  );

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_role_id uuid;
  given_role_id uuid;
  chosen_role_name text;
BEGIN
  SELECT id INTO default_role_id FROM public.roles WHERE name = 'learner';
  given_role_id := (new.raw_user_meta_data ->> 'role_id')::uuid;

  IF given_role_id IS NOT NULL THEN
    SELECT name INTO chosen_role_name FROM public.roles WHERE id = given_role_id;
    -- Security constraint: prevent public signup from assigning administrator role
    IF chosen_role_name = 'administrator' AND COALESCE(new.email, '') <> 'admin@scholarme.org' THEN
      given_role_id := default_role_id;
      chosen_role_name := 'learner';
    END IF;
  ELSE
    chosen_role_name := 'learner';
  END IF;

  INSERT INTO public.profiles (id, role_id, full_name, first_name, last_name, email)
  VALUES (
    new.id,
    COALESCE(given_role_id, default_role_id),
    COALESCE(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    COALESCE(new.email, '')
  )
  ON CONFLICT (id) DO NOTHING;

  -- Auto-create tutor record if the role is 'tutor' and the tutors table exists
  IF chosen_role_name = 'tutor' THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'tutors'
    ) THEN
      INSERT INTO public.tutors (user_id)
      VALUES (new.id)
      ON CONFLICT (user_id) DO NOTHING;
    END IF;
  END IF;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();