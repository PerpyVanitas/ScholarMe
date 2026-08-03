-- Migration: 20260803020000_event_attendance_and_xp.sql
-- Description: Create event_attendance table for QR check-in/check-out tracking and XP calculation

SET statement_timeout = 0;

CREATE TABLE IF NOT EXISTS public.event_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.facility_events(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    check_in_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    check_out_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    xp_awarded INTEGER DEFAULT 0 NOT NULL,
    status TEXT DEFAULT 'checked_in' NOT NULL CHECK (status IN ('checked_in', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_event_profile_attendance UNIQUE (event_id, profile_id)
);

ALTER TABLE public.event_attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view event attendance" ON public.event_attendance;
CREATE POLICY "Anyone can view event attendance" ON public.event_attendance 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can check in themselves" ON public.event_attendance;
CREATE POLICY "Users can check in themselves" ON public.event_attendance 
FOR INSERT WITH CHECK (
  profile_id = auth.uid() OR public.is_admin(auth.uid())
);

DROP POLICY IF EXISTS "Users can update their own attendance" ON public.event_attendance;
CREATE POLICY "Users can update their own attendance" ON public.event_attendance 
FOR UPDATE USING (
  profile_id = auth.uid() OR public.is_admin(auth.uid())
);

DROP POLICY IF EXISTS "Admins can delete attendance logs" ON public.event_attendance;
CREATE POLICY "Admins can delete attendance logs" ON public.event_attendance 
FOR DELETE USING (
  public.is_admin(auth.uid())
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_event_attendance_event_id ON public.event_attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendance_profile_id ON public.event_attendance(profile_id);

-- Updated at trigger
DROP TRIGGER IF EXISTS handle_updated_at ON public.event_attendance;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.event_attendance
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
