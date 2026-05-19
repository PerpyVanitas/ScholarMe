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