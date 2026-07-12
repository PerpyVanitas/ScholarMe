SET statement_timeout = 0;
CREATE TABLE IF NOT EXISTS forum_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view forum posts"
    ON forum_posts FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can insert forum posts"
    ON forum_posts FOR INSERT
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own posts"
    ON forum_posts FOR UPDATE
    USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete their own posts"
    ON forum_posts FOR DELETE
    USING (auth.uid() = author_id);


CREATE TABLE IF NOT EXISTS forum_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view forum replies"
    ON forum_replies FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can insert forum replies"
    ON forum_replies FOR INSERT
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own replies"
    ON forum_replies FOR UPDATE
    USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete their own replies"
    ON forum_replies FOR DELETE
    USING (auth.uid() = author_id);

