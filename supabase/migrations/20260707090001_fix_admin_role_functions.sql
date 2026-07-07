-- Fix role helper functions to correctly recognize super_admin.
-- Some RLS policies rely on public.is_admin(auth.uid()).

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Treat super_admin as admin for RLS purposes.
  RETURN public.has_role(user_id, ARRAY['administrator', 'super_admin', 'president']);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.has_role(user_id, ARRAY['super_admin']);
END;
$$ LANGUAGE plpgsql;

