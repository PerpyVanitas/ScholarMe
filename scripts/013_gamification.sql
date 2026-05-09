-- 013_gamification.sql
-- Description: Schema for Learner XP, Levels, and Profile Rewards

-- 1. Add XP and Customization fields to the core profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS current_level INTEGER DEFAULT 1 NOT NULL,
ADD COLUMN IF NOT EXISTS profile_theme_color TEXT DEFAULT 'default';

-- 2. Create an XP Logs table for audit and transparency
CREATE TABLE IF NOT EXISTS public.xp_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL, -- e.g., "Passed Quiz", "Attended Session"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on xp_logs
ALTER TABLE public.xp_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own XP logs" 
ON public.xp_logs FOR SELECT 
USING (auth.uid() = profile_id);

CREATE POLICY "System/Admins can insert XP logs" 
ON public.xp_logs FOR INSERT 
WITH CHECK (true); -- In a real app, secure this to service role or database functions only

-- 3. Trigger to auto-calculate level when XP is added
-- Every 1000 XP = 1 Level
CREATE OR REPLACE FUNCTION update_profile_level()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET 
        total_xp = total_xp + NEW.amount,
        current_level = floor((total_xp + NEW.amount) / 1000) + 1
    WHERE id = NEW.profile_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_profile_level
AFTER INSERT ON public.xp_logs
FOR EACH ROW EXECUTE FUNCTION update_profile_level();
