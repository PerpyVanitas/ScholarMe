-- Add indexes for scale readiness on tutor search queries (P14-4)

CREATE INDEX IF NOT EXISTS idx_tutor_profiles_specializations ON tutor_profiles USING GIN (specializations);
CREATE INDEX IF NOT EXISTS idx_tutor_profiles_availability_status ON tutor_profiles (availability_status);
CREATE INDEX IF NOT EXISTS idx_tutor_profiles_average_rating ON tutor_profiles (average_rating DESC);
