-- Direction Document (v1) Schema Extensions

-- 1. Portfolio Settings
CREATE TABLE IF NOT EXISTS public.portfolio_settings (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_public BOOLEAN NOT NULL DEFAULT false,
  share_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  custom_bio TEXT,
  github_url TEXT,
  resume_url TEXT,
  featured_badges TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.portfolio_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Portfolio settings are viewable by owner or if public" ON public.portfolio_settings
  FOR SELECT USING (
    auth.uid() = user_id OR is_public = true
  );

CREATE POLICY "Portfolio settings editable by owner" ON public.portfolio_settings
  FOR ALL USING (auth.uid() = user_id);

-- 2. Tutor Endorsements (Tutor -> Learner)
CREATE TABLE IF NOT EXISTS public.tutor_endorsements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  learner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.tutor_endorsements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Endorsements viewable by learner or tutor or public if learner portfolio public" ON public.tutor_endorsements
  FOR SELECT USING (
    auth.uid() = learner_id OR auth.uid() = tutor_id OR is_public = true
  );

CREATE POLICY "Tutor can insert endorsement" ON public.tutor_endorsements
  FOR INSERT WITH CHECK (auth.uid() = tutor_id);

CREATE POLICY "Learner or tutor can update endorsement" ON public.tutor_endorsements
  FOR UPDATE USING (auth.uid() = learner_id OR auth.uid() = tutor_id);

-- 3. Officer Handoff Notes
CREATE TABLE IF NOT EXISTS public.officer_handoff_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_key TEXT NOT NULL,
  term_id UUID REFERENCES public.org_terms(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  key_contacts TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.officer_handoff_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Handoff notes viewable by authenticated users" ON public.officer_handoff_notes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Handoff notes insertable by officers or admins" ON public.officer_handoff_notes
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- 4. Mentorship Preferences
CREATE TABLE IF NOT EXISTS public.mentorship_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_type TEXT NOT NULL CHECK (role_type IN ('mentor', 'mentee', 'both')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  interests TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.mentorship_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mentorship preferences viewable by authenticated members" ON public.mentorship_preferences
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Mentorship preferences editable by owner" ON public.mentorship_preferences
  FOR ALL USING (auth.uid() = user_id);

-- 5. Milestone Events
CREATE TABLE IF NOT EXISTS public.milestone_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  milestone_key TEXT NOT NULL,
  achieved_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, milestone_key)
);

ALTER TABLE public.milestone_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Milestone events viewable by owner" ON public.milestone_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Milestone events insertable by owner" ON public.milestone_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. Institutional Wiki Docs
CREATE TABLE IF NOT EXISTS public.institutional_wiki_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'SOP',
  content TEXT NOT NULL,
  access_role TEXT NOT NULL DEFAULT 'learner',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.institutional_wiki_docs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Institutional wiki docs viewable by authenticated users" ON public.institutional_wiki_docs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Wiki docs manageable by admins" ON public.institutional_wiki_docs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.name IN ('administrator', 'super_admin')
    )
  );
