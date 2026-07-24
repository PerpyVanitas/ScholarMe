-- Drop duplicate indexes (different names, same columns)

DROP INDEX IF EXISTS public.idx_study_set_items_set; -- keeping idx_study_set_items_study_set_id
DROP INDEX IF EXISTS public.idx_study_sets_owner; -- keeping idx_study_sets_owner_id
DROP INDEX IF EXISTS public.idx_messages_conversation; -- keeping idx_messages_conversation_id
DROP INDEX IF EXISTS public.idx_quiz_attempts_user; -- keeping idx_quiz_attempts_user_id

