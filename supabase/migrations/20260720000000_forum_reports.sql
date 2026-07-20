-- Forum Reports Migration

CREATE TABLE IF NOT EXISTS forum_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE forum_reports ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can insert a report
CREATE POLICY "Users can report posts"
    ON forum_reports FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);

-- Only admin/officers can read reports
CREATE POLICY "Admins can view reports"
    ON forum_reports FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role_id IN (
          SELECT id FROM roles WHERE name IN ('super_admin', 'administrator', 'president', 'secretary', 'vice_president', 'treasurer', 'auditor')
        )
      )
    );

-- Only admin/officers can update reports (to mark as reviewed/dismissed)
CREATE POLICY "Admins can update reports"
    ON forum_reports FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role_id IN (
          SELECT id FROM roles WHERE name IN ('super_admin', 'administrator', 'president', 'secretary', 'vice_president', 'treasurer', 'auditor')
        )
      )
    );
