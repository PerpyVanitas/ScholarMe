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

ALTER TABLE public.profiles ALTER COLUMN role_id SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN total_xp SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN current_level SET NOT NULL;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

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

ALTER TABLE public.roles DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.auth_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  card_id text NOT NULL UNIQUE,
  pin text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  issued_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

ALTER TABLE public.auth_cards ADD COLUMN IF NOT EXISTS revoked_at timestamptz;

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT tc.constraint_name 
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'auth_cards' AND ccu.column_name = 'status' AND tc.constraint_type = 'CHECK'
    LOOP
        EXECUTE 'ALTER TABLE public.auth_cards DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

ALTER TABLE public.auth_cards ADD CONSTRAINT auth_cards_status_check CHECK (status IN ('active', 'revoked'));

ALTER TABLE public.auth_cards DROP CONSTRAINT IF EXISTS auth_cards_user_id_fkey;
ALTER TABLE public.auth_cards ADD CONSTRAINT auth_cards_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

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

CREATE TABLE IF NOT EXISTS public.specializations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  category text
);

ALTER TABLE public.specializations 
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS category text;

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

ALTER TABLE public.tutor_availability
  ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE public.tutors DROP CONSTRAINT IF EXISTS tutors_user_id_fkey;
ALTER TABLE public.tutors ADD CONSTRAINT tutors_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.tutor_specializations DROP CONSTRAINT IF EXISTS tutor_specializations_tutor_id_fkey;
ALTER TABLE public.tutor_specializations ADD CONSTRAINT tutor_specializations_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.tutors(id) ON DELETE CASCADE;
ALTER TABLE public.tutor_specializations DROP CONSTRAINT IF EXISTS tutor_specializations_specialization_id_fkey;
ALTER TABLE public.tutor_specializations ADD CONSTRAINT tutor_specializations_specialization_id_fkey FOREIGN KEY (specialization_id) REFERENCES public.specializations(id) ON DELETE CASCADE;

ALTER TABLE public.tutor_availability DROP CONSTRAINT IF EXISTS tutor_availability_tutor_id_fkey;
ALTER TABLE public.tutor_availability ADD CONSTRAINT tutor_availability_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.tutors(id) ON DELETE CASCADE;

ALTER TABLE public.tutors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specializations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tutors_public_read" ON public.tutors;
CREATE POLICY "tutors_public_read" ON public.tutors FOR SELECT USING (true);
DROP POLICY IF EXISTS "tutors_own_write" ON public.tutors;
CREATE POLICY "tutors_own_write" ON public.tutors
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "tutors_insert_own" ON public.tutors;
CREATE POLICY "tutors_insert_own" ON public.tutors
  FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "tutor_spec_public_read" ON public.tutor_specializations;
CREATE POLICY "tutor_spec_public_read" ON public.tutor_specializations FOR SELECT USING (true);
DROP POLICY IF EXISTS "tutor_spec_own_write" ON public.tutor_specializations;
CREATE POLICY "tutor_spec_own_write" ON public.tutor_specializations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.tutors t WHERE t.id = tutor_id AND t.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "tutor_avail_public_read" ON public.tutor_availability;
CREATE POLICY "tutor_avail_public_read" ON public.tutor_availability FOR SELECT USING (true);
DROP POLICY IF EXISTS "tutor_avail_own_write" ON public.tutor_availability;
CREATE POLICY "tutor_avail_own_write" ON public.tutor_availability FOR ALL USING (
  EXISTS (SELECT 1 FROM public.tutors WHERE id = tutor_id AND user_id = auth.uid())
);
DROP POLICY IF EXISTS "specializations_public_read" ON public.specializations;
CREATE POLICY "specializations_public_read" ON public.specializations FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid REFERENCES public.tutors(id) ON DELETE CASCADE,
  learner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  specialization_id uuid REFERENCES public.specializations(id) ON DELETE SET NULL,
  scheduled_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  cancellation_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT tc.constraint_name 
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'sessions' AND ccu.column_name = 'status' AND tc.constraint_type = 'CHECK'
    LOOP
        EXECUTE 'ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

ALTER TABLE public.sessions ADD CONSTRAINT sessions_status_check CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled'));

ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_tutor_id_fkey;
ALTER TABLE public.sessions ADD CONSTRAINT sessions_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.tutors(id) ON DELETE CASCADE;

ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_learner_id_fkey;
ALTER TABLE public.sessions ADD CONSTRAINT sessions_learner_id_fkey FOREIGN KEY (learner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_specialization_id_fkey;
ALTER TABLE public.sessions ADD CONSTRAINT sessions_specialization_id_fkey FOREIGN KEY (specialization_id) REFERENCES public.specializations(id) ON DELETE SET NULL;

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

CREATE TABLE IF NOT EXISTS public.session_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL UNIQUE REFERENCES public.sessions(id) ON DELETE CASCADE,
  learner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.session_ratings DROP CONSTRAINT IF EXISTS session_ratings_session_id_fkey;
ALTER TABLE public.session_ratings ADD CONSTRAINT session_ratings_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;

ALTER TABLE public.session_ratings DROP CONSTRAINT IF EXISTS session_ratings_learner_id_fkey;
ALTER TABLE public.session_ratings ADD CONSTRAINT session_ratings_learner_id_fkey FOREIGN KEY (learner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.session_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ratings_insert_learner" ON public.session_ratings;
CREATE POLICY "ratings_insert_learner" ON public.session_ratings
  FOR INSERT WITH CHECK (auth.uid() = learner_id);

DROP POLICY IF EXISTS "ratings_select_all" ON public.session_ratings;
CREATE POLICY "ratings_select_all" ON public.session_ratings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "ratings_admin_all" ON public.session_ratings;
CREATE POLICY "ratings_admin_all" ON public.session_ratings FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles p JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid() AND r.name = 'administrator'
  )
);

CREATE TABLE IF NOT EXISTS public.timesheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid NOT NULL REFERENCES public.tutors(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  clock_in timestamptz NOT NULL DEFAULT now(),
  clock_out timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.timesheets DROP CONSTRAINT IF EXISTS timesheets_tutor_id_fkey;
ALTER TABLE public.timesheets ADD CONSTRAINT timesheets_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.tutors(id) ON DELETE CASCADE;

ALTER TABLE public.timesheets DROP CONSTRAINT IF EXISTS timesheets_user_id_fkey;
ALTER TABLE public.timesheets ADD CONSTRAINT timesheets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "timesheets_select_own" ON public.timesheets;
CREATE POLICY "timesheets_select_own" ON public.timesheets
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "timesheets_insert_own" ON public.timesheets;
CREATE POLICY "timesheets_insert_own" ON public.timesheets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "timesheets_update_own" ON public.timesheets;
CREATE POLICY "timesheets_update_own" ON public.timesheets
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "timesheets_select_admin" ON public.timesheets;
CREATE POLICY "timesheets_select_admin" ON public.timesheets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p JOIN public.roles r ON p.role_id = r.id
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

ALTER TABLE public.polls DROP CONSTRAINT IF EXISTS polls_created_by_fkey;
ALTER TABLE public.polls ADD CONSTRAINT polls_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.poll_options DROP CONSTRAINT IF EXISTS poll_options_poll_id_fkey;
ALTER TABLE public.poll_options ADD CONSTRAINT poll_options_poll_id_fkey FOREIGN KEY (poll_id) REFERENCES public.polls(id) ON DELETE CASCADE;

ALTER TABLE public.user_votes DROP CONSTRAINT IF EXISTS user_votes_poll_id_fkey;
ALTER TABLE public.user_votes ADD CONSTRAINT user_votes_poll_id_fkey FOREIGN KEY (poll_id) REFERENCES public.polls(id) ON DELETE CASCADE;
ALTER TABLE public.user_votes DROP CONSTRAINT IF EXISTS user_votes_option_id_fkey;
ALTER TABLE public.user_votes ADD CONSTRAINT user_votes_option_id_fkey FOREIGN KEY (option_id) REFERENCES public.poll_options(id) ON DELETE CASCADE;
ALTER TABLE public.user_votes DROP CONSTRAINT IF EXISTS user_votes_user_id_fkey;
ALTER TABLE public.user_votes ADD CONSTRAINT user_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

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
DROP POLICY IF EXISTS "poll_options_admin_write" ON public.poll_options;
CREATE POLICY "poll_options_admin_write" ON public.poll_options FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid() AND r.name = 'administrator'
  )
);
DROP POLICY IF EXISTS "user_votes_insert_own" ON public.user_votes;
CREATE POLICY "user_votes_insert_own" ON public.user_votes
  FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "user_votes_public_count" ON public.user_votes;
CREATE POLICY "user_votes_public_count" ON public.user_votes
  FOR SELECT USING (true);

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

ALTER TABLE public.conversation_participants DROP CONSTRAINT IF EXISTS conversation_participants_conversation_id_fkey;
ALTER TABLE public.conversation_participants ADD CONSTRAINT conversation_participants_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;
ALTER TABLE public.conversation_participants DROP CONSTRAINT IF EXISTS conversation_participants_profile_id_fkey;
ALTER TABLE public.conversation_participants ADD CONSTRAINT conversation_participants_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_conversation_id_fkey;
ALTER TABLE public.messages ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE public.messages ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

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
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'system',
  is_read boolean DEFAULT false,
  link text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT tc.constraint_name 
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'notifications' AND ccu.column_name = 'type' AND tc.constraint_type = 'CHECK'
    LOOP
        EXECUTE 'ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (type IN ('session', 'system', 'resource'));

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_own" ON public.notifications;
CREATE POLICY "notifications_own" ON public.notifications
  FOR ALL USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.xp_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  reason text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.xp_logs DROP CONSTRAINT IF EXISTS xp_logs_profile_id_fkey;
ALTER TABLE public.xp_logs ADD CONSTRAINT xp_logs_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

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

CREATE TABLE IF NOT EXISTS public.device_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  token text NOT NULL,
  platform text DEFAULT 'android',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.device_tokens DROP CONSTRAINT IF EXISTS device_tokens_user_id_fkey;
ALTER TABLE public.device_tokens ADD CONSTRAINT device_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT tc.constraint_name 
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'device_tokens' AND ccu.column_name = 'platform' AND tc.constraint_type = 'CHECK'
    LOOP
        EXECUTE 'ALTER TABLE public.device_tokens DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

ALTER TABLE public.device_tokens ADD CONSTRAINT device_tokens_platform_check CHECK (platform IN ('ios', 'android', 'web'));

ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "device_tokens_own" ON public.device_tokens;
CREATE POLICY "device_tokens_own" ON public.device_tokens
  FOR ALL USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.repositories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  access_role text NOT NULL DEFAULT 'all',
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

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT tc.constraint_name 
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'repositories' AND ccu.column_name = 'access_role' AND tc.constraint_type = 'CHECK'
    LOOP
        EXECUTE 'ALTER TABLE public.repositories DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

ALTER TABLE public.repositories ADD CONSTRAINT repositories_access_role_check CHECK (access_role IN ('all', 'tutor', 'admin'));

ALTER TABLE public.repositories DROP CONSTRAINT IF EXISTS repositories_owner_id_fkey;
ALTER TABLE public.repositories ADD CONSTRAINT repositories_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.resources DROP CONSTRAINT IF EXISTS resources_repository_id_fkey;
ALTER TABLE public.resources ADD CONSTRAINT resources_repository_id_fkey FOREIGN KEY (repository_id) REFERENCES public.repositories(id) ON DELETE CASCADE;
ALTER TABLE public.resources DROP CONSTRAINT IF EXISTS resources_uploaded_by_fkey;
ALTER TABLE public.resources ADD CONSTRAINT resources_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "repositories_own_or_public" ON public.repositories;
CREATE POLICY "repositories_read_by_access" ON public.repositories
  FOR SELECT USING (
    owner_id = auth.uid()
    OR access_role = 'all'
    OR (
      access_role = 'tutor'
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.roles r ON p.role_id = r.id
        WHERE p.id = auth.uid() AND r.name IN ('tutor', 'administrator')
      )
    )
    OR (
      access_role = 'admin'
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.roles r ON p.role_id = r.id
        WHERE p.id = auth.uid() AND r.name = 'administrator'
      )
    )
  );

DROP POLICY IF EXISTS "repositories_own_write" ON public.repositories;
CREATE POLICY "repositories_own_write" ON public.repositories
  FOR ALL USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "resources_repo_access" ON public.resources;
CREATE POLICY "resources_read_by_repo_access" ON public.resources
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.repositories r
      WHERE r.id = resources.repository_id
        AND (
          r.owner_id = auth.uid()
          OR r.access_role = 'all'
          OR (
            r.access_role = 'tutor'
            AND EXISTS (
              SELECT 1 FROM public.profiles p
              JOIN public.roles ro ON p.role_id = ro.id
              WHERE p.id = auth.uid() AND ro.name IN ('tutor', 'administrator')
            )
          )
          OR (
            r.access_role = 'admin'
            AND EXISTS (
              SELECT 1 FROM public.profiles p
              JOIN public.roles ro ON p.role_id = ro.id
              WHERE p.id = auth.uid() AND ro.name = 'administrator'
            )
          )
        )
    )
  );
DROP POLICY IF EXISTS "resources_repo_owner_insert" ON public.resources;
CREATE POLICY "resources_repo_owner_insert" ON public.resources
  FOR INSERT WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.repositories r
      WHERE r.id = resources.repository_id AND r.owner_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "resources_owner_or_uploader_delete" ON public.resources;
CREATE POLICY "resources_owner_or_uploader_delete" ON public.resources
  FOR DELETE USING (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.repositories r
      WHERE r.id = resources.repository_id AND r.owner_id = auth.uid()
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

ALTER TABLE public.analytics_logs DROP CONSTRAINT IF EXISTS analytics_logs_user_id_fkey;
ALTER TABLE public.analytics_logs ADD CONSTRAINT analytics_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

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

CREATE TABLE IF NOT EXISTS public.study_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  source_type text NOT NULL DEFAULT 'manual',
  source_id uuid,
  visibility text NOT NULL DEFAULT 'private',
  generation_mode text NOT NULL DEFAULT 'flashcard',
  difficulty text NOT NULL DEFAULT 'medium',
  question_count integer NOT NULL DEFAULT 10,
  tags text[] DEFAULT '{}',
  archived boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_public boolean DEFAULT false,
  source_resource_id uuid REFERENCES public.resources(id) ON DELETE SET NULL,
  is_archived boolean DEFAULT false
);

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT tc.constraint_name 
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'study_sets' AND ccu.column_name = 'source_type' AND tc.constraint_type = 'CHECK'
    LOOP
        EXECUTE 'ALTER TABLE public.study_sets DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

ALTER TABLE public.study_sets ADD CONSTRAINT study_sets_source_type_check CHECK (source_type IN ('manual', 'resource', 'upload'));

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT tc.constraint_name 
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'study_sets' AND ccu.column_name = 'visibility' AND tc.constraint_type = 'CHECK'
    LOOP
        EXECUTE 'ALTER TABLE public.study_sets DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

ALTER TABLE public.study_sets ADD CONSTRAINT study_sets_visibility_check CHECK (visibility IN ('private', 'shared'));

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT tc.constraint_name 
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'study_sets' AND ccu.column_name = 'generation_mode' AND tc.constraint_type = 'CHECK'
    LOOP
        EXECUTE 'ALTER TABLE public.study_sets DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

ALTER TABLE public.study_sets ADD CONSTRAINT study_sets_generation_mode_check CHECK (generation_mode IN ('flashcard', 'multiple_choice', 'true_false', 'identification', 'matching', 'mixed'));

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT tc.constraint_name 
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'study_sets' AND ccu.column_name = 'difficulty' AND tc.constraint_type = 'CHECK'
    LOOP
        EXECUTE 'ALTER TABLE public.study_sets DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

ALTER TABLE public.study_sets ADD CONSTRAINT study_sets_difficulty_check CHECK (difficulty IN ('easy', 'medium', 'hard'));

ALTER TABLE public.study_sets ALTER COLUMN generation_mode DROP NOT NULL;
ALTER TABLE public.study_sets ALTER COLUMN generation_mode SET DEFAULT 'flashcard';
ALTER TABLE public.study_sets ALTER COLUMN difficulty SET DEFAULT 'medium';

CREATE TABLE IF NOT EXISTS public.study_set_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  study_set_id uuid NOT NULL REFERENCES public.study_sets(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('flashcard', 'multiple_choice', 'true_false', 'identification', 'matching')),
  prompt text NOT NULL,
  answer text,
  options jsonb,
  explanation text,
  order_index integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  question text NOT NULL DEFAULT '',
  correct_answer_index integer DEFAULT 0,
  display_order integer NOT NULL DEFAULT 0
);

ALTER TABLE public.study_set_items 
  ADD COLUMN IF NOT EXISTS question text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS correct_answer_index integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  study_set_id uuid NOT NULL REFERENCES public.study_sets(id) ON DELETE CASCADE,
  score numeric,
  total_items integer NOT NULL DEFAULT 0,
  answers jsonb,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  total_questions integer NOT NULL DEFAULT 0,
  time_spent_seconds integer DEFAULT 0
);

ALTER TABLE public.quiz_attempts
  ADD COLUMN IF NOT EXISTS total_questions integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS time_spent_seconds integer DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.user_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_type text,
  extracted_content text,
  visibility text NOT NULL DEFAULT 'private',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT tc.constraint_name 
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'user_uploads' AND ccu.column_name = 'visibility' AND tc.constraint_type = 'CHECK'
    LOOP
        EXECUTE 'ALTER TABLE public.user_uploads DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

ALTER TABLE public.user_uploads ADD CONSTRAINT user_uploads_visibility_check CHECK (visibility IN ('private', 'shared'));

ALTER TABLE public.study_sets DROP CONSTRAINT IF EXISTS study_sets_user_id_fkey;
ALTER TABLE public.study_sets ADD CONSTRAINT study_sets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.study_sets DROP CONSTRAINT IF EXISTS study_sets_owner_id_fkey;
ALTER TABLE public.study_sets ADD CONSTRAINT study_sets_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.study_sets DROP CONSTRAINT IF EXISTS study_sets_source_resource_id_fkey;
ALTER TABLE public.study_sets ADD CONSTRAINT study_sets_source_resource_id_fkey FOREIGN KEY (source_resource_id) REFERENCES public.resources(id) ON DELETE SET NULL;

ALTER TABLE public.study_set_items DROP CONSTRAINT IF EXISTS study_set_items_study_set_id_fkey;
ALTER TABLE public.study_set_items ADD CONSTRAINT study_set_items_study_set_id_fkey FOREIGN KEY (study_set_id) REFERENCES public.study_sets(id) ON DELETE CASCADE;

ALTER TABLE public.quiz_attempts DROP CONSTRAINT IF EXISTS quiz_attempts_user_id_fkey;
ALTER TABLE public.quiz_attempts ADD CONSTRAINT quiz_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.quiz_attempts DROP CONSTRAINT IF EXISTS quiz_attempts_study_set_id_fkey;
ALTER TABLE public.quiz_attempts ADD CONSTRAINT quiz_attempts_study_set_id_fkey FOREIGN KEY (study_set_id) REFERENCES public.study_sets(id) ON DELETE CASCADE;

ALTER TABLE public.user_uploads DROP CONSTRAINT IF EXISTS user_uploads_user_id_fkey;
ALTER TABLE public.user_uploads ADD CONSTRAINT user_uploads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.study_sets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "study_sets_select" ON public.study_sets;
CREATE POLICY "study_sets_select" ON public.study_sets
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = owner_id OR is_public = true);

DROP POLICY IF EXISTS "study_sets_insert" ON public.study_sets;
CREATE POLICY "study_sets_insert" ON public.study_sets
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "study_sets_update" ON public.study_sets;
CREATE POLICY "study_sets_update" ON public.study_sets
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "study_sets_delete" ON public.study_sets;
CREATE POLICY "study_sets_delete" ON public.study_sets
  FOR DELETE USING (auth.uid() = user_id OR auth.uid() = owner_id);

ALTER TABLE public.study_set_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "study_set_items_select" ON public.study_set_items;
CREATE POLICY "study_set_items_select" ON public.study_set_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.study_sets s
      WHERE s.id = study_set_items.study_set_id
        AND (s.user_id = auth.uid() OR s.owner_id = auth.uid() OR s.is_public = true)
    )
  );

DROP POLICY IF EXISTS "study_set_items_insert" ON public.study_set_items;
CREATE POLICY "study_set_items_insert" ON public.study_set_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.study_sets s
      WHERE s.id = study_set_items.study_set_id
        AND (s.user_id = auth.uid() OR s.owner_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "study_set_items_update" ON public.study_set_items;
CREATE POLICY "study_set_items_update" ON public.study_set_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.study_sets s
      WHERE s.id = study_set_items.study_set_id
        AND (s.user_id = auth.uid() OR s.owner_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "study_set_items_delete" ON public.study_set_items;
CREATE POLICY "study_set_items_delete" ON public.study_set_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.study_sets s
      WHERE s.id = study_set_items.study_set_id
        AND (s.user_id = auth.uid() OR s.owner_id = auth.uid())
    )
  );

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quiz_attempts_select" ON public.quiz_attempts;
CREATE POLICY "quiz_attempts_select" ON public.quiz_attempts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "quiz_attempts_insert" ON public.quiz_attempts;
CREATE POLICY "quiz_attempts_insert" ON public.quiz_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.user_uploads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_uploads_select" ON public.user_uploads;
CREATE POLICY "user_uploads_select" ON public.user_uploads
  FOR SELECT USING (auth.uid() = user_id OR visibility = 'shared');

DROP POLICY IF EXISTS "user_uploads_insert" ON public.user_uploads;
CREATE POLICY "user_uploads_insert" ON public.user_uploads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_uploads_delete" ON public.user_uploads;
CREATE POLICY "user_uploads_delete" ON public.user_uploads
  FOR DELETE USING (auth.uid() = user_id);

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
  INSERT INTO public.roles (name) VALUES ('learner') ON CONFLICT (name) DO NOTHING;
  INSERT INTO public.roles (name) VALUES ('tutor') ON CONFLICT (name) DO NOTHING;
  INSERT INTO public.roles (name) VALUES ('administrator') ON CONFLICT (name) DO NOTHING;

  SELECT id INTO default_role_id FROM public.roles WHERE name = 'learner';
  given_role_id := (new.raw_user_meta_data ->> 'role_id')::uuid;

  IF given_role_id IS NOT NULL THEN
    SELECT name INTO chosen_role_name FROM public.roles WHERE id = given_role_id;
    IF chosen_role_name = 'administrator' AND COALESCE(new.email, '') <> 'admin@scholarme.org' THEN
      given_role_id := default_role_id;
      chosen_role_name := 'learner';
    END IF;
  ELSE
    chosen_role_name := COALESCE(new.raw_user_meta_data ->> 'role_name', new.raw_user_meta_data ->> 'role', 'learner');
    IF chosen_role_name = 'administrator' AND COALESCE(new.email, '') <> 'admin@scholarme.org' THEN
      chosen_role_name := 'learner';
    END IF;
    SELECT id INTO given_role_id FROM public.roles WHERE name = chosen_role_name;
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

  IF COALESCE(chosen_role_name, 'learner') = 'tutor' THEN
    INSERT INTO public.tutors (user_id)
    VALUES (new.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION sync_study_sets_compat()
RETURNS trigger AS $$
BEGIN
  IF NEW.user_id IS NULL AND NEW.owner_id IS NOT NULL THEN
    NEW.user_id := NEW.owner_id;
  ELSIF NEW.owner_id IS NULL AND NEW.user_id IS NOT NULL THEN
    NEW.owner_id := NEW.user_id;
  END IF;

  IF NEW.is_public IS NOT NULL THEN
    IF NEW.is_public = true THEN
      NEW.visibility := 'shared';
    ELSE
      NEW.visibility := 'private';
    END IF;
  ELSIF NEW.visibility IS NOT NULL THEN
    IF NEW.visibility = 'shared' THEN
      NEW.is_public := true;
    ELSE
      NEW.is_public := false;
    END IF;
  END IF;

  IF NEW.is_archived IS NOT NULL THEN
    NEW.archived := NEW.is_archived;
  ELSIF NEW.archived IS NOT NULL THEN
    NEW.is_archived := NEW.archived;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_study_sets_compat ON public.study_sets;
CREATE TRIGGER trigger_sync_study_sets_compat
  BEFORE INSERT OR UPDATE ON public.study_sets
  FOR EACH ROW EXECUTE FUNCTION sync_study_sets_compat();

CREATE OR REPLACE FUNCTION sync_study_set_items_order()
RETURNS trigger AS $$
BEGIN
  IF NEW.order_index IS NULL AND NEW.display_order IS NOT NULL THEN
    NEW.order_index := NEW.display_order;
  ELSIF NEW.display_order IS NULL AND NEW.order_index IS NOT NULL THEN
    NEW.display_order := NEW.order_index;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_study_set_items_order ON public.study_set_items;
CREATE TRIGGER trigger_sync_study_set_items_order
  BEFORE INSERT OR UPDATE ON public.study_set_items
  FOR EACH ROW EXECUTE FUNCTION sync_study_set_items_order();

CREATE OR REPLACE FUNCTION sync_study_set_items_question_prompt()
RETURNS trigger AS $$
BEGIN
  IF NEW.question IS NULL AND NEW.prompt IS NOT NULL THEN
    NEW.question := NEW.prompt;
  ELSIF NEW.prompt IS NULL AND NEW.question IS NOT NULL THEN
    NEW.prompt := NEW.question;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_study_set_items_question_prompt ON public.study_set_items;
CREATE TRIGGER trigger_sync_study_set_items_question_prompt
  BEFORE INSERT OR UPDATE ON public.study_set_items
  FOR EACH ROW EXECUTE FUNCTION sync_study_set_items_question_prompt();

CREATE OR REPLACE FUNCTION sync_quiz_attempts_total()
RETURNS trigger AS $$
BEGIN
  IF NEW.total_questions IS NULL AND NEW.total_items IS NOT NULL THEN
    NEW.total_questions := NEW.total_items;
  ELSIF NEW.total_items IS NULL AND NEW.total_questions IS NOT NULL THEN
    NEW.total_items := NEW.total_questions;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_quiz_attempts_total ON public.quiz_attempts;
CREATE TRIGGER trigger_sync_quiz_attempts_total
  BEFORE INSERT OR UPDATE ON public.quiz_attempts
  FOR EACH ROW EXECUTE FUNCTION sync_quiz_attempts_total();

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
CREATE INDEX IF NOT EXISTS idx_timesheets_user ON public.timesheets(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sets_user ON public.study_sets(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sets_owner ON public.study_sets(owner_id);
CREATE INDEX IF NOT EXISTS idx_study_set_items_set ON public.study_set_items(study_set_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON public.quiz_attempts(user_id);
