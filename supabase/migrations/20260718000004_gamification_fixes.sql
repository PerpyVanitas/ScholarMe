SET statement_timeout = 0;

-- Prevent negative XP values in xp_logs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.check_constraints
        WHERE constraint_name = 'xp_logs_amount_check'
    ) THEN
        ALTER TABLE public.xp_logs ADD CONSTRAINT xp_logs_amount_check CHECK (amount >= 0);
    END IF;
END $$;
