-- Query to find slow joins and missing indexes

EXPLAIN ANALYZE
SELECT 
  s.id, 
  s.scheduled_date, 
  s.status, 
  t.user_id as tutor_user_id, 
  p.full_name as tutor_name,
  l.full_name as learner_name
FROM public.sessions s
JOIN public.tutors t ON s.tutor_id = t.id
JOIN public.profiles p ON t.user_id = p.id
JOIN public.profiles l ON s.learner_id = l.id
WHERE s.status IN ('pending', 'confirmed')
ORDER BY s.scheduled_date DESC
LIMIT 50;

