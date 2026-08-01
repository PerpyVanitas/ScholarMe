-- Database Hotspot Composite Indexes Migration
-- Target query hotspots: tutor availability, sessions, timesheets, and audit logs

-- Composite index on tutor availability for day of week queries
CREATE INDEX IF NOT EXISTS idx_tutor_availability_tutor_day
  ON public.tutor_availability (tutor_id, day_of_week);

-- Composite index on sessions for tutor status schedule lookups
CREATE INDEX IF NOT EXISTS idx_sessions_tutor_status_date
  ON public.sessions (tutor_id, status, created_at DESC);

-- Composite index on underlying timesheets table (attendance_logs view) for clock-in/out calculations
CREATE INDEX IF NOT EXISTS idx_timesheets_tutor_clock_out
  ON public.timesheets (user_id, clock_out, clock_in DESC);

-- Composite index on audit logs for actor action searches
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_created
  ON public.audit_logs (actor_id, created_at DESC);
