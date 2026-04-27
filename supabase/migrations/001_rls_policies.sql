-- ============================================================
-- ScholarMe — Row Level Security Policies
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- ── profiles ─────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Admins and tutors can view all profiles
CREATE POLICY "profiles_select_staff" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.name IN ('administrator', 'tutor')
    )
  );

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins can update any profile
CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.name = 'administrator'
    )
  );

-- ── sessions ─────────────────────────────────────────────────
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Learners can see their own sessions
CREATE POLICY "sessions_select_learner" ON sessions
  FOR SELECT USING (auth.uid() = learner_id);

-- Tutors can see sessions assigned to them
CREATE POLICY "sessions_select_tutor" ON sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tutors t WHERE t.id = sessions.tutor_id AND t.profile_id = auth.uid()
    )
  );

-- Admins can see all sessions
CREATE POLICY "sessions_select_admin" ON sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.name = 'administrator'
    )
  );

-- Learners can create sessions
CREATE POLICY "sessions_insert_learner" ON sessions
  FOR INSERT WITH CHECK (auth.uid() = learner_id);

-- Tutors and admins can update sessions
CREATE POLICY "sessions_update_staff" ON sessions
  FOR UPDATE USING (
    auth.uid() = learner_id OR
    EXISTS (SELECT 1 FROM tutors t WHERE t.id = sessions.tutor_id AND t.profile_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles p JOIN roles r ON p.role_id = r.id WHERE p.id = auth.uid() AND r.name = 'administrator')
  );

-- ── notifications ─────────────────────────────────────────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert_service" ON notifications
  FOR INSERT WITH CHECK (true); -- Restricted by service role key in API routes

-- ── timesheets ────────────────────────────────────────────────
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "timesheets_select_own" ON timesheets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "timesheets_insert_own" ON timesheets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "timesheets_update_own" ON timesheets
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins can view all timesheets
CREATE POLICY "timesheets_select_admin" ON timesheets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.name = 'administrator'
    )
  );

-- ── conversations & messages ──────────────────────────────────
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations_select_participant" ON conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversations.id AND cp.profile_id = auth.uid()
    )
  );

CREATE POLICY "conversation_participants_select_own" ON conversation_participants
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "messages_select_participant" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id AND cp.profile_id = auth.uid()
    )
  );

CREATE POLICY "messages_insert_participant" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id AND cp.profile_id = auth.uid()
    )
  );
