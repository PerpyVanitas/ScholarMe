-- Create StudySet table for flashcards and quizzes
CREATE TABLE IF NOT EXISTS study_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  source_type TEXT NOT NULL CHECK (source_type IN ('resource', 'upload')),
  source_id UUID REFERENCES study_uploads(id) ON DELETE SET NULL,
  source_resource_id UUID REFERENCES resources(id) ON DELETE SET NULL,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'shared')),
  generation_mode TEXT NOT NULL CHECK (generation_mode IN ('flashcard', 'multiple_choice', 'true_false', 'identification', 'matching', 'mixed')),
  difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  question_count INTEGER NOT NULL DEFAULT 10,
  tags TEXT[] DEFAULT '{}',
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create StudySetItem table for individual flashcards/questions
CREATE TABLE IF NOT EXISTS study_set_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_set_id UUID NOT NULL REFERENCES study_sets(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('flashcard', 'multiple_choice', 'true_false', 'identification', 'matching')),
  prompt TEXT NOT NULL,
  answer TEXT NOT NULL,
  options TEXT[], -- For multiple choice: ["option1", "option2", ...]
  explanation TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create StudyUpload table for user-uploaded files
CREATE TABLE IF NOT EXISTS study_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  extracted_content TEXT,
  extraction_status TEXT DEFAULT 'pending' CHECK (extraction_status IN ('pending', 'success', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create QuizAttempt table for tracking study progress
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  study_set_id UUID NOT NULL REFERENCES study_sets(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_items INTEGER NOT NULL,
  answers JSONB, -- Store user answers: { "item_id": "user_answer", ... }
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for study_sets
ALTER TABLE study_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own study sets" ON study_sets
  FOR SELECT USING (auth.uid() = owner_id OR visibility = 'shared');

CREATE POLICY "Users can create study sets" ON study_sets
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own study sets" ON study_sets
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own study sets" ON study_sets
  FOR DELETE USING (auth.uid() = owner_id);

-- Create RLS policies for study_set_items
ALTER TABLE study_set_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view items of accessible study sets" ON study_set_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM study_sets
      WHERE study_sets.id = study_set_items.study_set_id
      AND (study_sets.owner_id = auth.uid() OR study_sets.visibility = 'shared')
    )
  );

CREATE POLICY "Users can manage items in their study sets" ON study_set_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM study_sets
      WHERE study_sets.id = study_set_items.study_set_id
      AND study_sets.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update items in their study sets" ON study_set_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM study_sets
      WHERE study_sets.id = study_set_items.study_set_id
      AND study_sets.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete items from their study sets" ON study_set_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM study_sets
      WHERE study_sets.id = study_set_items.study_set_id
      AND study_sets.owner_id = auth.uid()
    )
  );

-- Create RLS policies for study_uploads
ALTER TABLE study_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own uploads" ON study_uploads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can upload files" ON study_uploads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own uploads" ON study_uploads
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for quiz_attempts
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own attempts" ON quiz_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can record their own attempts" ON quiz_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_study_sets_owner ON study_sets(owner_id);
CREATE INDEX idx_study_sets_visibility ON study_sets(visibility);
CREATE INDEX idx_study_set_items_study_set ON study_set_items(study_set_id);
CREATE INDEX idx_study_uploads_user ON study_uploads(user_id);
CREATE INDEX idx_quiz_attempts_user_study_set ON quiz_attempts(user_id, study_set_id);
