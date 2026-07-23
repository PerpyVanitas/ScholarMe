-- Migration: 20260723010000_attendance_indexes.sql
-- Description: Create compound indexes on attendance_logs for high-performance PLC live desk activity calculations

CREATE INDEX IF NOT EXISTS idx_attendance_logs_active_shift 
ON public.attendance_logs (clock_in, clock_out) 
WHERE clock_out IS NULL;

CREATE INDEX IF NOT EXISTS idx_attendance_logs_user_clock_in 
ON public.attendance_logs (user_id, clock_in DESC);
