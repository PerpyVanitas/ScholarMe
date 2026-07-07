-- Phase 29: Study group chat, group session discovery, analytics

-- 1. Study group messages
CREATE TABLE IF NOT EXISTS public.study_group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_group_messages_group_id
  ON public.study_group_messages(group_id, created_at);

ALTER TABLE public.study_group_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can read messages"
  ON public.study_group_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.study_group_members m
      WHERE m.group_id = study_group_messages.group_id
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can send messages"
  ON public.study_group_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.study_group_members m
      WHERE m.group_id = study_group_messages.group_id
        AND m.user_id = auth.uid()
    )
  );

-- 2. Allow learners to browse open group sessions
DROP POLICY IF EXISTS "sessions_group_open_select" ON public.sessions;
CREATE POLICY "sessions_group_open_select" ON public.sessions
  FOR SELECT USING (
    max_participants > 1
    AND status IN ('pending', 'confirmed')
    AND scheduled_date >= CURRENT_DATE
  );

-- 3. Learners can view sessions they joined as participants
DROP POLICY IF EXISTS "sessions_participant_select" ON public.sessions;
CREATE POLICY "sessions_participant_select" ON public.sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.session_participants sp
      WHERE sp.session_id = sessions.id
        AND sp.learner_id = auth.uid()
    )
  );

-- 4. Migrate tutor_peer_reviews into tutor_reviews (if legacy table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'tutor_peer_reviews'
  ) THEN
    INSERT INTO public.tutor_reviews (reviewer_id, tutor_id, rating, feedback, created_at)
    SELECT reviewer_id, reviewee_id, rating, COALESCE(feedback, ''), created_at
    FROM public.tutor_peer_reviews tpr
    WHERE NOT EXISTS (
      SELECT 1 FROM public.tutor_reviews tr
      WHERE tr.reviewer_id = tpr.reviewer_id
        AND tr.tutor_id = tpr.reviewee_id
        AND tr.created_at = tpr.created_at
    );
  END IF;
END $$;
