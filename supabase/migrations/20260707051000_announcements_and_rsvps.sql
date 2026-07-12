SET statement_timeout = 0;
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority BOOLEAN DEFAULT false,
    author_id UUID REFERENCES public.profiles(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view announcements" ON public.announcements;
CREATE POLICY "Anyone can view announcements" ON public.announcements FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can insert announcements" ON public.announcements;
CREATE POLICY "Admins can insert announcements" ON public.announcements FOR INSERT WITH CHECK (
  public.is_admin(auth.uid())
);
DROP POLICY IF EXISTS "Admins can update announcements" ON public.announcements;
CREATE POLICY "Admins can update announcements" ON public.announcements FOR UPDATE USING (
  public.is_admin(auth.uid())
);
DROP POLICY IF EXISTS "Admins can delete announcements" ON public.announcements;
CREATE POLICY "Admins can delete announcements" ON public.announcements FOR DELETE USING (
  public.is_admin(auth.uid())
);

CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;
DROP TRIGGER IF EXISTS handle_updated_at ON public.announcements;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);


CREATE TABLE IF NOT EXISTS public.event_rsvps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.facility_events(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('going', 'maybe', 'not_going')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(event_id, profile_id)
);

ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view event RSVPs" ON public.event_rsvps;
CREATE POLICY "Anyone can view event RSVPs" ON public.event_rsvps FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own RSVP" ON public.event_rsvps;
CREATE POLICY "Users can insert their own RSVP" ON public.event_rsvps FOR INSERT WITH CHECK (
  profile_id = auth.uid()
);

DROP POLICY IF EXISTS "Users can update their own RSVP" ON public.event_rsvps;
CREATE POLICY "Users can update their own RSVP" ON public.event_rsvps FOR UPDATE USING (
  profile_id = auth.uid()
);

DROP POLICY IF EXISTS "Users can delete their own RSVP" ON public.event_rsvps;
CREATE POLICY "Users can delete their own RSVP" ON public.event_rsvps FOR DELETE USING (
  profile_id = auth.uid()
);

DROP TRIGGER IF EXISTS handle_updated_at ON public.event_rsvps;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.event_rsvps
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

