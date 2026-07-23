-- Migration: 20260723010000_attendance_indexes.sql
-- Description: Create compound indexes on timesheets (attendance_logs) for high-performance PLC live desk activity calculations

CREATE INDEX IF NOT EXISTS idx_timesheets_active_shift 
ON public.timesheets (clock_in, clock_out) 
WHERE clock_out IS NULL;

CREATE INDEX IF NOT EXISTS idx_timesheets_user_clock_in 
ON public.timesheets (user_id, clock_in DESC);

-- Create an updatable view so that frontend/API references to attendance_logs work transparently
CREATE OR REPLACE VIEW public.attendance_logs AS 
SELECT * FROM public.timesheets;
