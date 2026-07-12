-- Add Referral System
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id);

-- Weekly Challenges (Global)
CREATE TABLE IF NOT EXISTS weekly_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    target_amount INTEGER NOT NULL,
    current_progress INTEGER DEFAULT 0,
    xp_reward_multiplier DECIMAL(3,2) DEFAULT 1.5,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL
);

ALTER TABLE weekly_challenges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Weekly challenges are viewable by everyone" ON weekly_challenges;
CREATE POLICY "Weekly challenges are viewable by everyone" ON weekly_challenges FOR SELECT USING (true);
DROP POLICY IF EXISTS "Weekly challenges insertable by admin" ON weekly_challenges;
CREATE POLICY "Weekly challenges insertable by admin" ON weekly_challenges FOR INSERT WITH CHECK (
    public.is_admin(auth.uid())
);
DROP POLICY IF EXISTS "Weekly challenges updatable by admin" ON weekly_challenges;
CREATE POLICY "Weekly challenges updatable by admin" ON weekly_challenges FOR UPDATE USING (
    public.is_admin(auth.uid())
);

-- Daily Quests (Per User)
CREATE TABLE IF NOT EXISTS daily_quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    quest_type TEXT NOT NULL,
    target INTEGER NOT NULL,
    progress INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    xp_reward INTEGER DEFAULT 50,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE daily_quests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own quests" ON daily_quests;
CREATE POLICY "Users can view their own quests" ON daily_quests FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own quests" ON daily_quests;
CREATE POLICY "Users can update their own quests" ON daily_quests FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "System can insert quests" ON daily_quests;
CREATE POLICY "System can insert quests" ON daily_quests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Integrations & Webhooks Config
CREATE TABLE IF NOT EXISTS integration_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_name TEXT NOT NULL UNIQUE,
    webhook_url TEXT,
    api_key TEXT,
    is_active BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE integration_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Integration configs viewable by admins" ON integration_configs;
CREATE POLICY "Integration configs viewable by admins" ON integration_configs FOR SELECT USING (
    public.is_admin(auth.uid())
);
DROP POLICY IF EXISTS "Integration configs updatable by admins" ON integration_configs;
CREATE POLICY "Integration configs updatable by admins" ON integration_configs FOR UPDATE USING (
    public.is_admin(auth.uid())
);
DROP POLICY IF EXISTS "Integration configs insertable by admins" ON integration_configs;
CREATE POLICY "Integration configs insertable by admins" ON integration_configs FOR INSERT WITH CHECK (
    public.is_admin(auth.uid())
);
