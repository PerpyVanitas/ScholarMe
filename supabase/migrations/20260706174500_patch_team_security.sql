SET statement_timeout = 0;
-- Migration: Patch Team Security & Gamify Tutors
-- 1. Restrict team_tasks Row Level Security
DROP POLICY IF EXISTS "Anyone can manage team tasks" ON public.team_tasks;

CREATE POLICY "Officers can manage team tasks" ON public.team_tasks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.roles r ON p.role_id = r.id
      WHERE p.id = auth.uid()
      AND r.name IN ('officer', 'president', 'committee_head', 'admin', 'super_admin')
    )
  );

-- 2. Award XP to Tutors on Session Completion
CREATE OR REPLACE FUNCTION update_tutor_statistics()
RETURNS TRIGGER AS $$
DECLARE
  session_duration_hours numeric(10,2);
  xp_to_award integer;
BEGIN
  -- We only care when the status changes TO 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Calculate duration in hours
    session_duration_hours := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 3600.0;
    IF session_duration_hours < 0 THEN
      session_duration_hours := session_duration_hours + 24;
    END IF;

    -- Award 50 XP per hour tutored (rounded down)
    xp_to_award := FLOOR(session_duration_hours * 50);

    -- Update the tutors table
    UPDATE public.tutors
    SET 
      total_sessions_completed = COALESCE(total_sessions_completed, 0) + 1,
      total_hours_tutored = COALESCE(total_hours_tutored, 0) + session_duration_hours,
      total_students_helped = (
        SELECT COUNT(DISTINCT learner_id)
        FROM public.sessions
        WHERE tutor_id = NEW.tutor_id AND status = 'completed'
      )
    WHERE id = NEW.tutor_id;

    -- Award XP to the tutor's profile
    UPDATE public.profiles
    SET total_xp = COALESCE(total_xp, 0) + xp_to_award
    WHERE id = NEW.tutor_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

