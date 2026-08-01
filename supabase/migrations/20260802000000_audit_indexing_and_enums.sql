-- Database Hotspot Composite Indexes & Audit Logs Migration
-- Target query hotspots: tutor availability, sessions, timesheets, and audit logs

-- Ensure audit_logs table exists for security audit events
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

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

-- Composite index on analytics logs for user action searches
CREATE INDEX IF NOT EXISTS idx_analytics_logs_user_action
  ON public.analytics_logs (user_id, action, created_at DESC);
