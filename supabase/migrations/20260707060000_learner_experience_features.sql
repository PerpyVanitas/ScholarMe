-- 1. AI Quiz Flagging
CREATE TABLE IF NOT EXISTS public.quiz_question_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    study_set_item_id UUID NOT NULL REFERENCES public.study_set_items(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.quiz_question_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can flag questions" ON public.quiz_question_flags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all flags" ON public.quiz_question_flags FOR SELECT USING (public.is_admin(auth.uid()));

-- 2. Study Groups
CREATE TABLE IF NOT EXISTS public.study_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.study_group_members (
    group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (group_id, user_id)
);

ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public groups are viewable by everyone" ON public.study_groups FOR SELECT USING (is_public = true OR EXISTS (SELECT 1 FROM public.study_group_members WHERE group_id = id AND user_id = auth.uid()));
CREATE POLICY "Authenticated users can create groups" ON public.study_groups FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Group owners can update groups" ON public.study_groups FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Members can view members" ON public.study_group_members FOR SELECT USING (EXISTS (SELECT 1 FROM public.study_groups WHERE id = group_id AND (is_public = true)) OR auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.study_group_members m WHERE m.group_id = group_id AND m.user_id = auth.uid()));
CREATE POLICY "Users can join public groups" ON public.study_group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Members can leave groups" ON public.study_group_members FOR DELETE USING (auth.uid() = user_id);

-- 3. Sessions & No-Show Penalties
ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_status_check;
ALTER TABLE public.sessions ADD CONSTRAINT sessions_status_check CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show'));

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS no_show_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS booking_suspended_until TIMESTAMP WITH TIME ZONE;

-- Create function to auto-suspend after 3 no-shows
CREATE OR REPLACE FUNCTION handle_session_no_show()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'no_show' AND OLD.status != 'no_show' THEN
        -- Only increment for the learner
        UPDATE public.profiles
        SET no_show_count = no_show_count + 1
        WHERE id = NEW.learner_id;
        
        -- Check if suspension is needed
        UPDATE public.profiles
        SET booking_suspended_until = NOW() + INTERVAL '30 days'
        WHERE id = NEW.learner_id AND no_show_count >= 3;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_session_no_show ON public.sessions;
CREATE TRIGGER trigger_session_no_show
AFTER UPDATE ON public.sessions
FOR EACH ROW EXECUTE FUNCTION handle_session_no_show();

-- 4. Recurring & Group Sessions
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS recurring_id UUID;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS max_participants INTEGER NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS public.session_participants (
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    learner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'no_show', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (session_id, learner_id)
);

ALTER TABLE public.session_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Learners can view their participations" ON public.session_participants FOR SELECT USING (auth.uid() = learner_id OR EXISTS (SELECT 1 FROM public.sessions s JOIN public.tutors t ON s.tutor_id = t.id WHERE s.id = session_id AND t.user_id = auth.uid()));
CREATE POLICY "Learners can register" ON public.session_participants FOR INSERT WITH CHECK (auth.uid() = learner_id);
CREATE POLICY "Tutors can update participant status" ON public.session_participants FOR UPDATE USING (EXISTS (SELECT 1 FROM public.sessions s JOIN public.tutors t ON s.tutor_id = t.id WHERE s.id = session_id AND t.user_id = auth.uid()));

-- Migrate existing learners in sessions to session_participants
INSERT INTO public.session_participants (session_id, learner_id, status)
SELECT id, learner_id, 'registered' FROM public.sessions
WHERE learner_id IS NOT NULL
ON CONFLICT DO NOTHING;
