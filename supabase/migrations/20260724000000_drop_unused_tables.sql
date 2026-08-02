-- Drop genuinely unused tables identified in audit
-- NOTE: ratelimit_windows was intentionally kept - it backs the increment_rate_limit RPC
-- used by AI and auth rate limiting. Do NOT drop it.

DROP TABLE IF EXISTS public.feature_flags CASCADE;
DROP TABLE IF EXISTS public.finance_audit_findings CASCADE;
DROP TABLE IF EXISTS public.physical_books CASCADE;
DROP TABLE IF EXISTS public.tutor_peer_reviews CASCADE;
DROP TABLE IF EXISTS public.user_quests CASCADE;
DROP TABLE IF EXISTS public.user_uploads CASCADE;
