-- Migration: 20260718000002_schema_cleanup_2.sql
-- Description: Clean up duplicate tables, fix foreign key references to public.profiles, add ON DELETE CASCADE, and fix finance_scards event_id.

-- 1. Drop unused/duplicated tables
DROP TABLE IF EXISTS public.physical_books;
DROP TABLE IF EXISTS public.user_quests;

-- 2. Standardize foreign keys from auth.users to public.profiles and add ON DELETE CASCADE

-- user_streaks
ALTER TABLE public.user_streaks DROP CONSTRAINT IF EXISTS user_streaks_user_id_fkey;
ALTER TABLE public.user_streaks ADD CONSTRAINT user_streaks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- facility_events
ALTER TABLE public.facility_events DROP CONSTRAINT IF EXISTS facility_events_organizer_id_fkey;
ALTER TABLE public.facility_events ADD CONSTRAINT facility_events_organizer_id_fkey FOREIGN KEY (organizer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- flashcard_attempts
ALTER TABLE public.flashcard_attempts DROP CONSTRAINT IF EXISTS flashcard_attempts_user_id_fkey;
ALTER TABLE public.flashcard_attempts ADD CONSTRAINT flashcard_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- login_history
ALTER TABLE public.login_history DROP CONSTRAINT IF EXISTS login_history_user_id_fkey;
ALTER TABLE public.login_history ADD CONSTRAINT login_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- user_badges
ALTER TABLE public.user_badges DROP CONSTRAINT IF EXISTS user_badges_user_id_fkey;
ALTER TABLE public.user_badges ADD CONSTRAINT user_badges_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- forum_posts
ALTER TABLE public.forum_posts DROP CONSTRAINT IF EXISTS forum_posts_author_id_fkey;
ALTER TABLE public.forum_posts ADD CONSTRAINT forum_posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- forum_replies
ALTER TABLE public.forum_replies DROP CONSTRAINT IF EXISTS forum_replies_author_id_fkey;
ALTER TABLE public.forum_replies ADD CONSTRAINT forum_replies_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3. Add ON DELETE CASCADE to existing public.profiles foreign keys

-- auth_cards
ALTER TABLE public.auth_cards DROP CONSTRAINT IF EXISTS auth_cards_user_id_fkey;
ALTER TABLE public.auth_cards ADD CONSTRAINT auth_cards_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- tutors
ALTER TABLE public.tutors DROP CONSTRAINT IF EXISTS tutors_user_id_fkey;
ALTER TABLE public.tutors ADD CONSTRAINT tutors_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- sessions (learner_id)
ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_learner_id_fkey;
ALTER TABLE public.sessions ADD CONSTRAINT sessions_learner_id_fkey FOREIGN KEY (learner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- session_ratings (learner_id)
ALTER TABLE public.session_ratings DROP CONSTRAINT IF EXISTS session_ratings_learner_id_fkey;
ALTER TABLE public.session_ratings ADD CONSTRAINT session_ratings_learner_id_fkey FOREIGN KEY (learner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- repositories
ALTER TABLE public.repositories DROP CONSTRAINT IF EXISTS repositories_owner_id_fkey;
ALTER TABLE public.repositories ADD CONSTRAINT repositories_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- resources (uploaded_by)
ALTER TABLE public.resources DROP CONSTRAINT IF EXISTS resources_uploaded_by_fkey;
ALTER TABLE public.resources ADD CONSTRAINT resources_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- notifications
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- analytics_logs
ALTER TABLE public.analytics_logs DROP CONSTRAINT IF EXISTS analytics_logs_user_id_fkey;
ALTER TABLE public.analytics_logs ADD CONSTRAINT analytics_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- timesheets (user_id)
ALTER TABLE public.timesheets DROP CONSTRAINT IF EXISTS timesheets_user_id_fkey;
ALTER TABLE public.timesheets ADD CONSTRAINT timesheets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- polls
ALTER TABLE public.polls DROP CONSTRAINT IF EXISTS polls_created_by_fkey;
ALTER TABLE public.polls ADD CONSTRAINT polls_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- user_votes
ALTER TABLE public.user_votes DROP CONSTRAINT IF EXISTS user_votes_user_id_fkey;
ALTER TABLE public.user_votes ADD CONSTRAINT user_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- device_tokens
ALTER TABLE public.device_tokens DROP CONSTRAINT IF EXISTS device_tokens_user_id_fkey;
ALTER TABLE public.device_tokens ADD CONSTRAINT device_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- study_sets
ALTER TABLE public.study_sets DROP CONSTRAINT IF EXISTS study_sets_owner_id_fkey;
ALTER TABLE public.study_sets ADD CONSTRAINT study_sets_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- quiz_attempts
ALTER TABLE public.quiz_attempts DROP CONSTRAINT IF EXISTS quiz_attempts_user_id_fkey;
ALTER TABLE public.quiz_attempts ADD CONSTRAINT quiz_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- user_uploads
ALTER TABLE public.user_uploads DROP CONSTRAINT IF EXISTS user_uploads_user_id_fkey;
ALTER TABLE public.user_uploads ADD CONSTRAINT user_uploads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- conversation_participants
ALTER TABLE public.conversation_participants DROP CONSTRAINT IF EXISTS conversation_participants_profile_id_fkey;
ALTER TABLE public.conversation_participants ADD CONSTRAINT conversation_participants_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- messages
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE public.messages ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- xp_logs
ALTER TABLE public.xp_logs DROP CONSTRAINT IF EXISTS xp_logs_profile_id_fkey;
ALTER TABLE public.xp_logs ADD CONSTRAINT xp_logs_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- hs_designations
ALTER TABLE public.hs_designations DROP CONSTRAINT IF EXISTS hs_designations_user_id_fkey;
ALTER TABLE public.hs_designations ADD CONSTRAINT hs_designations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- finance_budget_requests (submitted_by)
ALTER TABLE public.finance_budget_requests DROP CONSTRAINT IF EXISTS finance_budget_requests_user_id_fkey;
ALTER TABLE public.finance_budget_requests ADD CONSTRAINT finance_budget_requests_user_id_fkey FOREIGN KEY (submitted_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- finance_petty_cash (submitted_by)
ALTER TABLE public.finance_petty_cash DROP CONSTRAINT IF EXISTS finance_petty_cash_user_id_fkey;
ALTER TABLE public.finance_petty_cash ADD CONSTRAINT finance_petty_cash_user_id_fkey FOREIGN KEY (submitted_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- finance_liquidations (submitted_by)
ALTER TABLE public.finance_liquidations DROP CONSTRAINT IF EXISTS finance_liquidations_user_id_fkey;
ALTER TABLE public.finance_liquidations ADD CONSTRAINT finance_liquidations_user_id_fkey FOREIGN KEY (submitted_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- team_tasks
ALTER TABLE public.team_tasks DROP CONSTRAINT IF EXISTS team_tasks_assignee_id_fkey;
ALTER TABLE public.team_tasks ADD CONSTRAINT team_tasks_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- team_schedules
ALTER TABLE public.team_schedules DROP CONSTRAINT IF EXISTS team_schedules_member_id_fkey;
ALTER TABLE public.team_schedules ADD CONSTRAINT team_schedules_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- system_feedback
ALTER TABLE public.system_feedback DROP CONSTRAINT IF EXISTS system_feedback_user_id_fkey;
ALTER TABLE public.system_feedback ADD CONSTRAINT system_feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- push_subscriptions
ALTER TABLE public.push_subscriptions DROP CONSTRAINT IF EXISTS push_subscriptions_user_id_fkey;
ALTER TABLE public.push_subscriptions ADD CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- resource_checkouts
ALTER TABLE public.resource_checkouts DROP CONSTRAINT IF EXISTS resource_checkouts_profile_id_fkey;
ALTER TABLE public.resource_checkouts ADD CONSTRAINT resource_checkouts_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- session_waitlists
ALTER TABLE public.session_waitlists DROP CONSTRAINT IF EXISTS session_waitlists_learner_id_fkey;
ALTER TABLE public.session_waitlists ADD CONSTRAINT session_waitlists_learner_id_fkey FOREIGN KEY (learner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- announcements
ALTER TABLE public.announcements DROP CONSTRAINT IF EXISTS announcements_author_id_fkey;
ALTER TABLE public.announcements ADD CONSTRAINT announcements_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- event_rsvps
ALTER TABLE public.event_rsvps DROP CONSTRAINT IF EXISTS event_rsvps_profile_id_fkey;
ALTER TABLE public.event_rsvps ADD CONSTRAINT event_rsvps_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- quiz_question_flags
ALTER TABLE public.quiz_question_flags DROP CONSTRAINT IF EXISTS quiz_question_flags_user_id_fkey;
ALTER TABLE public.quiz_question_flags ADD CONSTRAINT quiz_question_flags_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- study_groups
ALTER TABLE public.study_groups DROP CONSTRAINT IF EXISTS study_groups_created_by_fkey;
ALTER TABLE public.study_groups ADD CONSTRAINT study_groups_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- study_group_members
ALTER TABLE public.study_group_members DROP CONSTRAINT IF EXISTS study_group_members_user_id_fkey;
ALTER TABLE public.study_group_members ADD CONSTRAINT study_group_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- session_participants
ALTER TABLE public.session_participants DROP CONSTRAINT IF EXISTS session_participants_learner_id_fkey;
ALTER TABLE public.session_participants ADD CONSTRAINT session_participants_learner_id_fkey FOREIGN KEY (learner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- study_group_messages
ALTER TABLE public.study_group_messages DROP CONSTRAINT IF EXISTS study_group_messages_user_id_fkey;
ALTER TABLE public.study_group_messages ADD CONSTRAINT study_group_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- roadmap_items
ALTER TABLE public.roadmap_items DROP CONSTRAINT IF EXISTS roadmap_items_created_by_fkey;
ALTER TABLE public.roadmap_items ADD CONSTRAINT roadmap_items_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- roadmap_upvotes
ALTER TABLE public.roadmap_upvotes DROP CONSTRAINT IF EXISTS roadmap_upvotes_user_id_fkey;
ALTER TABLE public.roadmap_upvotes ADD CONSTRAINT roadmap_upvotes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- organization_settings
ALTER TABLE public.organization_settings DROP CONSTRAINT IF EXISTS organization_settings_updated_by_fkey;
ALTER TABLE public.organization_settings ADD CONSTRAINT organization_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- support_tickets
ALTER TABLE public.support_tickets DROP CONSTRAINT IF EXISTS support_tickets_user_id_fkey;
ALTER TABLE public.support_tickets ADD CONSTRAINT support_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- support_messages
ALTER TABLE public.support_messages DROP CONSTRAINT IF EXISTS support_messages_sender_id_fkey;
ALTER TABLE public.support_messages ADD CONSTRAINT support_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- daily_quests
ALTER TABLE public.daily_quests DROP CONSTRAINT IF EXISTS daily_quests_user_id_fkey;
ALTER TABLE public.daily_quests ADD CONSTRAINT daily_quests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 4. Alter finance_scards event_id to UUID
ALTER TABLE public.finance_scards
  ALTER COLUMN event_id TYPE uuid USING event_id::uuid,
  DROP CONSTRAINT IF EXISTS finance_scards_event_id_fkey,
  ADD CONSTRAINT finance_scards_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.facility_events(id) ON DELETE SET NULL;
