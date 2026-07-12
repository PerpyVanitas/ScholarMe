SET statement_timeout = 0;
-- Fix users who are in the tutors table but have their role set to learner
UPDATE public.profiles
SET role_id = (SELECT id FROM public.roles WHERE name = 'tutor')
WHERE id IN (SELECT user_id FROM public.tutors)
  AND role_id = (SELECT id FROM public.roles WHERE name = 'learner');

