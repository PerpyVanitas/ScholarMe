SET statement_timeout = 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_card_issued boolean DEFAULT false;

