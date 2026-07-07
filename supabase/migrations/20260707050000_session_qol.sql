-- Add is_paused for Vacation Mode
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT false;

-- Add tutor_memo for private notes
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS tutor_memo TEXT;
