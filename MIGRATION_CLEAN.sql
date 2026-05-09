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
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "profiles_admin_select_all" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.name = 'administrator'
    )
  );

CREATE POLICY IF NOT EXISTS "profiles_admin_update_all" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.name = 'administrator'
    )
  );

CREATE POLICY IF NOT EXISTS "profiles_public_read_for_tutors" ON public.profiles
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
BEGIN
  SELECT id INTO default_role_id FROM public.roles WHERE name = 'learner';
  given_role_id := (new.raw_user_meta_data ->> 'role_id')::uuid;

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

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE IF NOT EXISTS public.auth_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  card_id text NOT NULL UNIQUE,
  pin text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  issued_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

ALTER TABLE public.auth_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "auth_cards_admin_all" ON public.auth_cards
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.name = 'administrator'
    )
  );

CREATE TABLE IF NOT EXISTS public.specializations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  category text
);

CREATE TABLE IF NOT EXISTS public.tutors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  bio text,
  rating numeric(3,2) DEFAULT 0,
  total_ratings integer DEFAULT 0,
  hourly_rate numeric(10,2),
  years_experience integer,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tutor_specializations (
  tutor_id uuid REFERENCES public.tutors(id) ON DELETE CASCADE,
  specialization_id uuid REFERENCES public.specializations(id) ON DELETE CASCADE,
  PRIMARY KEY (tutor_id, specialization_id)
);

CREATE TABLE IF NOT EXISTS public.tutor_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid REFERENCES public.tutors(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.tutors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specializations ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "tutors_public_read" ON public.tutors FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "tutors_own_write" ON public.tutors FOR ALL USING (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "tutor_spec_public_read" ON public.tutor_specializations FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "tutor_avail_public_read" ON public.tutor_availability FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "tutor_avail_own_write" ON public.tutor_availability FOR ALL USING (
  EXISTS (SELECT 1 FROM public.tutors WHERE id = tutor_id AND user_id = auth.uid())
);
CREATE POLICY IF NOT EXISTS "specializations_public_read" ON public.specializations FOR SELECT USING (true);

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

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "sessions_learner_select" ON public.sessions
  FOR SELECT USING (learner_id = auth.uid());

CREATE POLICY IF NOT EXISTS "sessions_learner_insert" ON public.sessions
  FOR INSERT WITH CHECK (learner_id = auth.uid());

CREATE POLICY IF NOT EXISTS "sessions_tutor_select" ON public.sessions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tutors WHERE id = tutor_id AND user_id = auth.uid())
  );

CREATE POLICY IF NOT EXISTS "sessions_tutor_update" ON public.sessions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.tutors WHERE id = tutor_id AND user_id = auth.uid())
  );

CREATE POLICY IF NOT EXISTS "sessions_admin_all" ON public.sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.name = 'administrator'
    )
  );

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

CREATE POLICY IF NOT EXISTS "polls_public_read" ON public.polls FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "polls_admin_write" ON public.polls FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid() AND r.name = 'administrator'
  )
);
CREATE POLICY IF NOT EXISTS "poll_options_public_read" ON public.poll_options FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "user_votes_insert_own" ON public.user_votes
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "user_votes_public_count" ON public.user_votes
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_polls_status ON public.polls(status);
CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON public.poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_user_votes_poll_id ON public.user_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_user_votes_user_id ON public.user_votes(user_id);

CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now() NOT NULL,
  last_read_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (conversation_id, profile_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  is_edited boolean DEFAULT false
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "conversations_participant_read" ON public.conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = conversations.id AND profile_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "conversations_insert" ON public.conversations
  FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "participants_read" ON public.conversation_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants AS cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
        AND cp.profile_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "participants_insert" ON public.conversation_participants
  FOR INSERT WITH CHECK (
    profile_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = conversation_participants.conversation_id
        AND profile_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "participants_update_own" ON public.conversation_participants
  FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY IF NOT EXISTS "messages_read" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = messages.conversation_id AND profile_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "messages_insert" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = messages.conversation_id AND profile_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations SET updated_at = NEW.created_at WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON public.messages;
CREATE TRIGGER trigger_update_conversation_timestamp
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_timestamp();

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text,
  is_read boolean DEFAULT false,
  link text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "notifications_own" ON public.notifications
  FOR ALL USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.xp_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  reason text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.xp_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "xp_logs_own_read" ON public.xp_logs
  FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY IF NOT EXISTS "xp_logs_insert_any" ON public.xp_logs
  FOR INSERT WITH CHECK (true);

CREATE OR REPLACE FUNCTION update_profile_level()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET
    total_xp = total_xp + NEW.amount,
    current_level = floor((total_xp + NEW.amount) / 1000) + 1
  WHERE id = NEW.profile_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_profile_level ON public.xp_logs;
CREATE TRIGGER trigger_update_profile_level
  AFTER INSERT ON public.xp_logs
  FOR EACH ROW EXECUTE FUNCTION update_profile_level();

CREATE TABLE IF NOT EXISTS public.device_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  platform text DEFAULT 'android' CHECK (platform IN ('android', 'ios', 'web')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "device_tokens_own" ON public.device_tokens
  FOR ALL USING (user_id = auth.uid());

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

CREATE POLICY IF NOT EXISTS "repositories_own_or_public" ON public.repositories
  FOR SELECT USING (owner_id = auth.uid() OR is_public = true);

CREATE POLICY IF NOT EXISTS "repositories_own_write" ON public.repositories
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY IF NOT EXISTS "resources_repo_access" ON public.resources
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.repositories r
      WHERE r.id = resources.repository_id
        AND (r.owner_id = auth.uid() OR r.is_public = true)
    )
  );

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

CREATE POLICY IF NOT EXISTS "analytics_admin_read" ON public.analytics_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p JOIN public.roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.name = 'administrator'
    )
  );

CREATE POLICY IF NOT EXISTS "analytics_own_insert" ON public.analytics_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON public.profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_tutors_user_id ON public.tutors(user_id);
CREATE INDEX IF NOT EXISTS idx_tutors_available ON public.tutors(is_available);
CREATE INDEX IF NOT EXISTS idx_sessions_tutor_id ON public.sessions(tutor_id);
CREATE INDEX IF NOT EXISTS idx_sessions_learner_id ON public.sessions(learner_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON public.sessions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conv_participants_profile ON public.conversation_participants(profile_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);
