-- Add is_private column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_private boolean DEFAULT false;

-- Create friends table
CREATE TABLE IF NOT EXISTS friends (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id1 uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user_id2 uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id1, user_id2)
);

-- Enable RLS for friends
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own friend relationships" ON friends
  FOR SELECT USING (auth.uid() = user_id1 OR auth.uid() = user_id2);

CREATE POLICY "Users can insert friend relationships" ON friends
  FOR INSERT WITH CHECK (auth.uid() = user_id1);

CREATE POLICY "Users can update their own friend relationships" ON friends
  FOR UPDATE USING (auth.uid() = user_id1 OR auth.uid() = user_id2);

CREATE POLICY "Users can delete their own friend relationships" ON friends
  FOR DELETE USING (auth.uid() = user_id1 OR auth.uid() = user_id2);



