SET statement_timeout = 0;
-- Add SuperMemo-2 (SM-2) Spaced Repetition Columns to Flashcard Attempts
ALTER TABLE flashcard_attempts
ADD COLUMN ease_factor NUMERIC NOT NULL DEFAULT 2.5,
ADD COLUMN interval_days INTEGER NOT NULL DEFAULT 0,
ADD COLUMN next_review_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();

-- Create an index to quickly query due cards
CREATE INDEX IF NOT EXISTS idx_flashcard_attempts_next_review
ON flashcard_attempts(next_review_date);

