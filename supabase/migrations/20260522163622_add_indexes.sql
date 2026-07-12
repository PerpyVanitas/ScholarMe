SET statement_timeout = 0;
CREATE INDEX IF NOT EXISTS idx_sessions_tutor_id ON sessions(tutor_id);
CREATE INDEX IF NOT EXISTS idx_sessions_learner_id ON sessions(learner_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
-- Auth cards indices
CREATE INDEX IF NOT EXISTS idx_auth_cards_card_id ON auth_cards(card_id);
CREATE INDEX IF NOT EXISTS idx_resources_repository_id ON resources(repository_id);
CREATE INDEX IF NOT EXISTS idx_analytics_logs_user_id ON analytics_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_logs_created_at ON analytics_logs(created_at DESC);
