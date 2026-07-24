-- Drop genuinely unused tables identified in audit

DROP TABLE IF EXISTS public.feature_flags CASCADE;
DROP TABLE IF EXISTS public.finance_audit_findings CASCADE;
DROP TABLE IF EXISTS public.physical_books CASCADE;
DROP TABLE IF EXISTS public.ratelimit_windows CASCADE;
DROP TABLE IF EXISTS public.tutor_peer_reviews CASCADE;
DROP TABLE IF EXISTS public.user_quests CASCADE;
DROP TABLE IF EXISTS public.user_uploads CASCADE;

