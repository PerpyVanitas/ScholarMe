-- Messaging Upgrades
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES public.messages(id) ON DELETE SET NULL;

ALTER TABLE public.conversation_participants
ADD COLUMN IF NOT EXISTS last_read_message_id uuid REFERENCES public.messages(id) ON DELETE SET NULL;

-- Office Hours
ALTER TABLE public.sessions
ADD COLUMN IF NOT EXISTS is_office_hours boolean DEFAULT false;

-- Alumni Role
INSERT INTO public.roles (name)
VALUES ('Alumni')
ON CONFLICT (name) DO NOTHING;
