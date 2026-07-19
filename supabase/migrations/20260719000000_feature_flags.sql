-- Migration: Create Feature Flags Table

CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT false,
  rollout_percentage INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write feature flags
CREATE POLICY "Admins can manage feature flags"
  ON feature_flags
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role_id IN (
        SELECT id FROM roles WHERE name IN ('administrator', 'super_admin')
      )
    )
  );

-- Function to check if a feature is enabled for a user
CREATE OR REPLACE FUNCTION is_feature_enabled(feature_name VARCHAR, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  flag RECORD;
  hash_val INTEGER;
BEGIN
  SELECT * INTO flag FROM feature_flags WHERE name = feature_name;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  IF flag.is_enabled THEN
    RETURN TRUE;
  END IF;

  IF flag.rollout_percentage > 0 THEN
    -- Deterministic hash based on user_id and feature_name to return a stable 0-99 value
    hash_val := abs(hashtext(user_id::text || feature_name)) % 100;
    RETURN hash_val < flag.rollout_percentage;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
