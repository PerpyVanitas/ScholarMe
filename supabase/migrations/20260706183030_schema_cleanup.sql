SET statement_timeout = 0;
-- 1. Remove redundant columns from study_sets

-- Drop policies that depend on user_id first
DROP POLICY IF EXISTS "study_sets_select" ON public.study_sets;
DROP POLICY IF EXISTS "study_sets_insert" ON public.study_sets;
DROP POLICY IF EXISTS "study_sets_update" ON public.study_sets;
DROP POLICY IF EXISTS "study_sets_delete" ON public.study_sets;

DROP POLICY IF EXISTS "study_set_items_select" ON public.study_set_items;
DROP POLICY IF EXISTS "study_set_items_insert" ON public.study_set_items;
DROP POLICY IF EXISTS "study_set_items_update" ON public.study_set_items;
DROP POLICY IF EXISTS "study_set_items_delete" ON public.study_set_items;

ALTER TABLE public.study_sets 
  DROP COLUMN IF EXISTS user_id,
  DROP COLUMN IF EXISTS is_archived;

-- Recreate policies using owner_id
CREATE POLICY "study_sets_select" ON public.study_sets
  FOR SELECT USING (auth.uid() = owner_id OR is_public = true);

CREATE POLICY "study_sets_insert" ON public.study_sets
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "study_sets_update" ON public.study_sets
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "study_sets_delete" ON public.study_sets
  FOR DELETE USING (auth.uid() = owner_id);

CREATE POLICY "study_set_items_select" ON public.study_set_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.study_sets s
      WHERE s.id = study_set_items.study_set_id
        AND (s.owner_id = auth.uid() OR s.is_public = true)
    )
  );

CREATE POLICY "study_set_items_insert" ON public.study_set_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.study_sets s
      WHERE s.id = study_set_items.study_set_id
        AND (s.owner_id = auth.uid())
    )
  );

CREATE POLICY "study_set_items_update" ON public.study_set_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.study_sets s
      WHERE s.id = study_set_items.study_set_id
        AND (s.owner_id = auth.uid())
    )
  );

CREATE POLICY "study_set_items_delete" ON public.study_set_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.study_sets s
      WHERE s.id = study_set_items.study_set_id
        AND (s.owner_id = auth.uid())
    )
  );

-- 2. Add ON DELETE CASCADE to critical foreign keys
-- Drop existing constraints
ALTER TABLE public.poll_options DROP CONSTRAINT IF EXISTS poll_options_poll_id_fkey;
ALTER TABLE public.user_votes DROP CONSTRAINT IF EXISTS user_votes_poll_id_fkey;
ALTER TABLE public.study_set_items DROP CONSTRAINT IF EXISTS study_set_items_study_set_id_fkey;
ALTER TABLE public.auth_cards DROP CONSTRAINT IF EXISTS auth_cards_user_id_fkey;
ALTER TABLE public.device_tokens DROP CONSTRAINT IF EXISTS device_tokens_user_id_fkey;
ALTER TABLE public.push_subscriptions DROP CONSTRAINT IF EXISTS push_subscriptions_user_id_fkey;

-- Re-add with CASCADE
ALTER TABLE public.poll_options
  ADD CONSTRAINT poll_options_poll_id_fkey FOREIGN KEY (poll_id) REFERENCES public.polls(id) ON DELETE CASCADE;

ALTER TABLE public.user_votes
  ADD CONSTRAINT user_votes_poll_id_fkey FOREIGN KEY (poll_id) REFERENCES public.polls(id) ON DELETE CASCADE;

ALTER TABLE public.study_set_items
  ADD CONSTRAINT study_set_items_study_set_id_fkey FOREIGN KEY (study_set_id) REFERENCES public.study_sets(id) ON DELETE CASCADE;

ALTER TABLE public.auth_cards
  ADD CONSTRAINT auth_cards_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.device_tokens
  ADD CONSTRAINT device_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.push_subscriptions
  ADD CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3. Add Foreign Key Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_study_set_items_study_set_id ON public.study_set_items(study_set_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON public.poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_user_votes_poll_id ON public.user_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_sessions_learner_id ON public.sessions(learner_id);
CREATE INDEX IF NOT EXISTS idx_sessions_tutor_id ON public.sessions(tutor_id);
CREATE INDEX IF NOT EXISTS idx_resources_repository_id ON public.resources(repository_id);
CREATE INDEX IF NOT EXISTS idx_study_sets_owner_id ON public.study_sets(owner_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_study_set_id ON public.quiz_attempts(study_set_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON public.quiz_attempts(user_id);

