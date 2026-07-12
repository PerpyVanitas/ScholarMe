SET statement_timeout = 0;
-- Create flashcard_attempts table for Spaced Repetition (SM-2)
CREATE TABLE IF NOT EXISTS public.flashcard_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    study_set_item_id UUID REFERENCES public.study_set_items(id) ON DELETE CASCADE,
    rating INTEGER,
    repetitions INTEGER NOT NULL DEFAULT 0,
    ease_factor NUMERIC NOT NULL DEFAULT 2.5,
    interval_days INTEGER NOT NULL DEFAULT 0,
    next_review_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, study_set_item_id)
);

ALTER TABLE public.flashcard_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own flashcard attempts" ON public.flashcard_attempts;
CREATE POLICY "Users can view own flashcard attempts" ON public.flashcard_attempts FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own flashcard attempts" ON public.flashcard_attempts;
CREATE POLICY "Users can insert own flashcard attempts" ON public.flashcard_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own flashcard attempts" ON public.flashcard_attempts;
CREATE POLICY "Users can update own flashcard attempts" ON public.flashcard_attempts FOR UPDATE USING (auth.uid() = user_id);

-- Create an index to quickly query due cards
CREATE INDEX IF NOT EXISTS idx_flashcard_attempts_next_review
ON public.flashcard_attempts(next_review_date);

CREATE INDEX IF NOT EXISTS idx_flashcard_attempts_user_item
ON public.flashcard_attempts(user_id, study_set_item_id);

CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;
DROP TRIGGER IF EXISTS handle_updated_at ON public.flashcard_attempts;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.flashcard_attempts
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

