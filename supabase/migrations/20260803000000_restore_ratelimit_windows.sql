-- Restore ratelimit_windows table that was mistakenly dropped in 20260724000000_drop_unused_tables.sql
-- This table is required by the increment_rate_limit() RPC function used for AI and auth rate limiting.

CREATE TABLE IF NOT EXISTS public.ratelimit_windows (
    identifier TEXT PRIMARY KEY,
    timestamps BIGINT[] NOT NULL DEFAULT '{}'
);
