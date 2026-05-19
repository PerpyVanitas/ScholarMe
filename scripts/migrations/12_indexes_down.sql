-- Rollback migration: Dropping indexes created in 12_indexes.sql
DROP INDEX IF EXISTS public.idx_profiles_role_id;
DROP INDEX IF EXISTS public.idx_profiles_email;
DROP INDEX IF EXISTS public.idx_tutors_user_id;
DROP INDEX IF EXISTS public.idx_tutors_available;
DROP INDEX IF EXISTS public.idx_sessions_tutor_id;
DROP INDEX IF EXISTS public.idx_sessions_learner_id;
DROP INDEX IF EXISTS public.idx_sessions_status;
DROP INDEX IF EXISTS public.idx_sessions_date;
DROP INDEX IF EXISTS public.idx_messages_conversation;
DROP INDEX IF EXISTS public.idx_conv_participants_profile;
DROP INDEX IF EXISTS public.idx_notifications_user;
