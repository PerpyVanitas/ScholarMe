-- Resolve Supabase Advisor Critical Security Issues

-- 1. Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 2. Enable RLS on ratelimit_windows
ALTER TABLE public.ratelimit_windows ENABLE ROW LEVEL SECURITY;

-- 3. Fix attendance_logs View Security Definer
-- Explicitly drop and recreate with security_invoker = true
DROP VIEW IF EXISTS public.attendance_logs CASCADE;
CREATE VIEW public.attendance_logs WITH (security_invoker = true) AS 
SELECT * FROM public.timesheets;
