-- Add last_confirmed_at column to timesheets table to support 2-hour presence verification
ALTER TABLE public.timesheets 
ADD COLUMN IF NOT EXISTS last_confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Backfill existing open timesheets last_confirmed_at with clock_in if null
UPDATE public.timesheets 
SET last_confirmed_at = clock_in 
WHERE last_confirmed_at IS NULL;
