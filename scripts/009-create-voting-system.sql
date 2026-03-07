-- Voting System Tables (SSD Journey 6: Organization Voting)
-- Creates polls, poll_options, and user_votes tables for organization voting

-- Polls table - represents voting topics/polls
CREATE TABLE IF NOT EXISTS polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'closed')),
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ NOT NULL,
  allow_multiple_votes BOOLEAN DEFAULT FALSE,
  is_anonymous BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Poll options - the choices users can vote for
CREATE TABLE IF NOT EXISTS poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User votes - tracks who voted for what
CREATE TABLE IF NOT EXISTS user_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Prevent duplicate votes on same poll (unless allow_multiple_votes is true)
  UNIQUE(poll_id, user_id, option_id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_polls_status ON polls(status);
CREATE INDEX IF NOT EXISTS idx_polls_end_date ON polls(end_date);
CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_user_votes_poll_id ON user_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_user_votes_user_id ON user_votes(user_id);

-- Enable RLS
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for polls
CREATE POLICY "Polls are viewable by all authenticated users" ON polls
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can create polls" ON polls
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.name = 'administrator'
    )
  );

CREATE POLICY "Admins can update polls" ON polls
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.name = 'administrator'
    )
  );

CREATE POLICY "Admins can delete polls" ON polls
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.name = 'administrator'
    )
  );

-- RLS Policies for poll_options
CREATE POLICY "Poll options are viewable by all authenticated users" ON poll_options
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage poll options" ON poll_options
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.name = 'administrator'
    )
  );

-- RLS Policies for user_votes
CREATE POLICY "Users can view their own votes" ON user_votes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can vote on active polls" ON user_votes
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM polls 
      WHERE id = poll_id 
      AND status = 'active' 
      AND NOW() BETWEEN start_date AND end_date
    )
  );

-- Admins can view all votes (for anonymous polls, they still can't see who voted)
CREATE POLICY "Admins can view vote counts" ON user_votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.name = 'administrator'
    )
  );
