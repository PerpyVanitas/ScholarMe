-- Add statistical columns to tutors table
ALTER TABLE public.tutors 
ADD COLUMN IF NOT EXISTS total_sessions_completed integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_students_helped integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS response_rate numeric(5,2) DEFAULT 100.00,
ADD COLUMN IF NOT EXISTS total_hours_tutored numeric(10,2) DEFAULT 0.00;
