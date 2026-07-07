-- Add prep_notes to sessions
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS prep_notes text;

-- Add verification_status and verification_document_url to tutor_specializations
ALTER TABLE tutor_specializations ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected'));
ALTER TABLE tutor_specializations ADD COLUMN IF NOT EXISTS verification_document_url text;

-- Add dashboard_layout to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dashboard_layout jsonb DEFAULT '[]'::jsonb;
