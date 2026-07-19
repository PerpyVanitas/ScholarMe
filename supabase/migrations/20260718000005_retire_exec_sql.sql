SET statement_timeout = 0;

-- Retire the exec_sql function as part of Phase 7 (P7-3)
DROP FUNCTION IF EXISTS public.exec_sql(text);
