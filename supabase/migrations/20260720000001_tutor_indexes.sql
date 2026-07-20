-- Add indexes for scale readiness on tutor search queries (P14-4)

CREATE INDEX IF NOT EXISTS idx_tutors_is_available ON tutors (is_available);
CREATE INDEX IF NOT EXISTS idx_tutors_rating ON tutors (rating DESC);
CREATE INDEX IF NOT EXISTS idx_tutor_specializations_specialization_id ON tutor_specializations (specialization_id);
