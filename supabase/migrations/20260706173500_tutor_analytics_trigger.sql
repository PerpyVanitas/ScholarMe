-- Create a function to update tutor statistics when a session completes
CREATE OR REPLACE FUNCTION update_tutor_statistics()
RETURNS TRIGGER AS $$
DECLARE
  session_duration_hours numeric(10,2);
BEGIN
  -- We only care when the status changes TO 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Calculate duration in hours
    -- Assuming start_time and end_time are time without time zone
    session_duration_hours := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 3600.0;
    
    IF session_duration_hours < 0 THEN
      -- Handle edge case where session crosses midnight
      session_duration_hours := session_duration_hours + 24;
    END IF;

    -- Update the tutors table
    UPDATE public.tutors
    SET 
      total_sessions_completed = COALESCE(total_sessions_completed, 0) + 1,
      total_hours_tutored = COALESCE(total_hours_tutored, 0) + session_duration_hours,
      -- Update unique students helped by checking if this is the first completed session for this learner with this tutor
      total_students_helped = (
        SELECT COUNT(DISTINCT learner_id)
        FROM public.sessions
        WHERE tutor_id = NEW.tutor_id AND status = 'completed'
      )
    WHERE id = NEW.tutor_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_session_completed_update_stats ON public.sessions;
CREATE TRIGGER on_session_completed_update_stats
  AFTER UPDATE OF status ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_tutor_statistics();
