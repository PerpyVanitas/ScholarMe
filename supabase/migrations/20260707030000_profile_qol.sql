SET statement_timeout = 0;
-- Add new Profile columns
ALTER TABLE profiles
ADD COLUMN pronouns TEXT,
ADD COLUMN status_message VARCHAR(50),
ADD COLUMN social_links JSONB DEFAULT '{}'::jsonb;

-- Create Login History table
CREATE TABLE IF NOT EXISTS login_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on login_history
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own login history"
    ON login_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own login history"
    ON login_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

