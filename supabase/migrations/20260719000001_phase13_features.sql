-- Phase 13 Feature Proposals Migrations

-- 1. Forum Moderation Tooling (F-5)
ALTER TABLE forum_posts
ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE forum_replies
ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP WITH TIME ZONE;

-- 2. Membership Tracking (F-1)
CREATE TABLE IF NOT EXISTS memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    classification TEXT DEFAULT 'regular' CHECK (classification IN ('regular', 'premium', 'alumni')),
    dues_paid_until TIMESTAMP WITH TIME ZONE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own membership"
    ON memberships FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage memberships"
    ON memberships FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role_id IN (
          SELECT id FROM roles WHERE name IN ('super_admin', 'administrator', 'president', 'secretary')
        )
      )
    );

-- 3. Internal Elections (F-2)
CREATE TABLE IF NOT EXISTS elections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS election_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    election_id UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    position TEXT NOT NULL,
    manifesto TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS election_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    election_id UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES election_candidates(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(election_id, voter_id) -- One vote per election per user
);

ALTER TABLE elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE election_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE election_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view elections" ON elections FOR SELECT USING (true);
CREATE POLICY "Anyone can view candidates" ON election_candidates FOR SELECT USING (true);
CREATE POLICY "Users can view their own votes" ON election_votes FOR SELECT USING (auth.uid() = voter_id);
CREATE POLICY "Authenticated users can vote" ON election_votes FOR INSERT WITH CHECK (auth.uid() = voter_id);
CREATE POLICY "Admins can manage elections" ON elections FOR ALL USING (
      EXISTS (
        SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role_id IN (
          SELECT id FROM roles WHERE name IN ('super_admin', 'administrator', 'president')
        )
      )
);

-- 4. Governance Repo (F-3)
CREATE TABLE IF NOT EXISTS governance_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    document_type TEXT DEFAULT 'policy' CHECK (document_type IN ('policy', 'minutes', 'bylaws', 'other')),
    uploaded_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE governance_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view governance documents" ON governance_documents FOR SELECT USING (true);
CREATE POLICY "Admins can manage governance documents" ON governance_documents FOR ALL USING (
      EXISTS (
        SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role_id IN (
          SELECT id FROM roles WHERE name IN ('super_admin', 'administrator', 'president', 'secretary')
        )
      )
);
