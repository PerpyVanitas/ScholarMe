-- 012_messaging.sql
-- Description: Schema and RLS policies for Real-time In-App Messaging

-- 1. Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT -- Nullable, used for group chats
);

-- 2. Create conversation participants joining table
CREATE TABLE IF NOT EXISTS public.conversation_participants (
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (conversation_id, profile_id)
);

-- 3. Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_edited BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Setup RLS Policies

-- Conversations: Users can select/insert conversations they are part of
CREATE POLICY "Users can view their conversations" 
ON public.conversations FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_participants
        WHERE conversation_id = conversations.id
        AND profile_id = auth.uid()
    )
);

CREATE POLICY "Users can insert conversations"
ON public.conversations FOR INSERT
WITH CHECK (true); -- Anyone can start a conversation

-- Participants: Users can view participants of their conversations
CREATE POLICY "Users can view participants of their conversations"
ON public.conversation_participants FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_participants AS my_participants
        WHERE my_participants.conversation_id = conversation_participants.conversation_id
        AND my_participants.profile_id = auth.uid()
    )
);

CREATE POLICY "Users can add participants to conversations they are in"
ON public.conversation_participants FOR INSERT
WITH CHECK (
    auth.uid() = profile_id OR -- Adding themselves
    EXISTS (
        SELECT 1 FROM public.conversation_participants
        WHERE conversation_id = conversation_participants.conversation_id
        AND profile_id = auth.uid()
    )
);

-- Messages: Users can view/insert messages in their conversations
CREATE POLICY "Users can view messages in their conversations"
ON public.messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_participants
        WHERE conversation_id = messages.conversation_id
        AND profile_id = auth.uid()
    )
);

CREATE POLICY "Users can insert messages in their conversations"
ON public.messages FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.conversation_participants
        WHERE conversation_id = messages.conversation_id
        AND profile_id = auth.uid()
    )
    AND sender_id = auth.uid()
);

-- Add real-time publication for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Function to auto-update conversation's updated_at timestamp when a new message arrives
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations
    SET updated_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_timestamp
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION update_conversation_timestamp();
