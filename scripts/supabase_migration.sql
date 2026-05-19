================================================================================
SCHOLARME — SUPABASE DATABASE SETUP
================================================================================

INSTRUCTIONS FOR v0:
Run the following SQL migrations on my Supabase project to set up the ScholarMe
database. Execute each step in order. All statements use IF NOT EXISTS or
ON CONFLICT DO NOTHING so they are safe to run on an existing database.

================================================================================
STEP 1 — ROLES, PROFILES, AND AUTH TRIGGER
================================================================================

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


================================================================================
STEP 2 — AUTH CARDS
================================================================================

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

DROP POLICY IF EXISTS "auth_cards_admin_all" ON public.auth_cards;
CREATE POLICY "auth_cards_admin_all" ON public.auth_cards
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.name = 'administrator'
    )
  );


================================================================================
STEP 3 — TUTORS AND SPECIALIZATIONS
================================================================================

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

DROP POLICY IF EXISTS "tutors_public_read" ON public.tutors;
CREATE POLICY "tutors_public_read" ON public.tutors FOR SELECT USING (true);
DROP POLICY IF EXISTS "tutors_own_write" ON public.tutors;
CREATE POLICY "tutors_own_write" ON public.tutors FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS "tutor_spec_public_read" ON public.tutor_specializations;
CREATE POLICY "tutor_spec_public_read" ON public.tutor_specializations FOR SELECT USING (true);
DROP POLICY IF EXISTS "tutor_avail_public_read" ON public.tutor_availability;
CREATE POLICY "tutor_avail_public_read" ON public.tutor_availability FOR SELECT USING (true);
DROP POLICY IF EXISTS "tutor_avail_own_write" ON public.tutor_availability;
CREATE POLICY "tutor_avail_own_write" ON public.tutor_availability FOR ALL USING (
  EXISTS (SELECT 1 FROM public.tutors WHERE id = tutor_id AND user_id = auth.uid())
);
DROP POLICY IF EXISTS "specializations_public_read" ON public.specializations;
CREATE POLICY "specializations_public_read" ON public.specializations FOR SELECT USING (true);


================================================================================
STEP 4 — SESSIONS
================================================================================

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

DROP POLICY IF EXISTS "sessions_learner_select" ON public.sessions;
CREATE POLICY "sessions_learner_select" ON public.sessions
  FOR SELECT USING (learner_id = auth.uid());

DROP POLICY IF EXISTS "sessions_learner_insert" ON public.sessions;
CREATE POLICY "sessions_learner_insert" ON public.sessions
  FOR INSERT WITH CHECK (learner_id = auth.uid());

DROP POLICY IF EXISTS "sessions_tutor_select" ON public.sessions;
CREATE POLICY "sessions_tutor_select" ON public.sessions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tutors WHERE id = tutor_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "sessions_tutor_update" ON public.sessions;
CREATE POLICY "sessions_tutor_update" ON public.sessions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.tutors WHERE id = tutor_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "sessions_admin_all" ON public.sessions;
CREATE POLICY "sessions_admin_all" ON public.sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.name = 'administrator'
    )
  );


================================================================================
STEP 5 — VOTING / POLLS
================================================================================

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

CREATE INDEX IF NOT EXISTS idx_polls_status ON public.polls(status);
CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON public.poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_user_votes_poll_id ON public.user_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_user_votes_user_id ON public.user_votes(user_id);


================================================================================
STEP 6 — MESSAGING
================================================================================

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

DROP POLICY IF EXISTS "conversations_participant_read" ON public.conversations;
CREATE POLICY "conversations_participant_read" ON public.conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = conversations.id AND profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "conversations_insert" ON public.conversations;
CREATE POLICY "conversations_insert" ON public.conversations
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "participants_read" ON public.conversation_participants;
CREATE POLICY "participants_read" ON public.conversation_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants AS cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
        AND cp.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "participants_insert" ON public.conversation_participants;
CREATE POLICY "participants_insert" ON public.conversation_participants
  FOR INSERT WITH CHECK (
    profile_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = conversation_participants.conversation_id
        AND profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "participants_update_own" ON public.conversation_participants;
CREATE POLICY "participants_update_own" ON public.conversation_participants
  FOR UPDATE USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "messages_read" ON public.messages;
CREATE POLICY "messages_read" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = messages.conversation_id AND profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "messages_insert" ON public.messages;
CREATE POLICY "messages_insert" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = messages.conversation_id AND profile_id = auth.uid()
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

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


================================================================================
STEP 7 — NOTIFICATIONS
================================================================================

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

DROP POLICY IF EXISTS "notifications_own" ON public.notifications;
CREATE POLICY "notifications_own" ON public.notifications
  FOR ALL USING (user_id = auth.uid());


================================================================================
STEP 8 — GAMIFICATION (XP AND LEVELS)
================================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS total_xp integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS current_level integer DEFAULT 1 NOT NULL,
  ADD COLUMN IF NOT EXISTS profile_theme_color text DEFAULT 'default';

CREATE TABLE IF NOT EXISTS public.xp_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  reason text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.xp_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "xp_logs_own_read" ON public.xp_logs;
CREATE POLICY "xp_logs_own_read" ON public.xp_logs
  FOR SELECT USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "xp_logs_insert_any" ON public.xp_logs;
CREATE POLICY "xp_logs_insert_any" ON public.xp_logs
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


================================================================================
STEP 9 — DEVICE TOKENS
================================================================================

CREATE TABLE IF NOT EXISTS public.device_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  platform text DEFAULT 'android' CHECK (platform IN ('android', 'ios', 'web')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "device_tokens_own" ON public.device_tokens;
CREATE POLICY "device_tokens_own" ON public.device_tokens
  FOR ALL USING (user_id = auth.uid());


================================================================================
STEP 10 — REPOSITORIES AND RESOURCES
================================================================================

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


================================================================================
STEP 11 — ANALYTICS LOGS
================================================================================

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


================================================================================
STEP 12 — PERFORMANCE INDEXES
================================================================================

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


================================================================================
AFTER RUNNING — CHECKLIST
================================================================================

1. Go to Supabase > Settings > API
   Confirm SUPABASE_URL and SUPABASE_ANON_KEY match your .env.local file.

2. Go to Supabase > Authentication > Settings
   Set "Email confirmations" to OFF (or leave ON — the Android register route
   already sets email_confirm: true so Android users won't need to verify).

3. Go to Supabase > Storage
   Create a bucket named "avatars" with public read access enabled.

4. Go to Supabase > Table Editor > roles
   Verify there are exactly 3 rows: administrator, tutor, learner.

5. Go to Supabase > Authentication > Policies (for each table)
   Verify all RLS policies were created without errors.

================================================================================
END OF SETUP
================================================================================
