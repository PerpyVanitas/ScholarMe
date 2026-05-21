-- =============================================
-- System Audit Fixes Migration
-- =============================================

-- 1. Remove hardcoded email backdoor from is_super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Rely exclusively on the robust roles table check
  RETURN public.is_admin(user_id);
END;
$$ LANGUAGE plpgsql;

-- 2. Drop standard user mutating policies on hs_designations to prevent privilege escalation
DROP POLICY IF EXISTS "Users can insert own designations" ON public.hs_designations;
DROP POLICY IF EXISTS "Users can update own designations" ON public.hs_designations;
DROP POLICY IF EXISTS "Users can delete own designations" ON public.hs_designations;

-- 3. Prevent tutors from updating their own rating and total_ratings via direct API
CREATE OR REPLACE FUNCTION public.protect_tutor_ratings()
RETURNS trigger AS $$
BEGIN
  -- If the user doing the update is NOT an admin, silently revert rating columns to their old values
  IF NOT public.is_admin(auth.uid()) THEN
    NEW.rating := OLD.rating;
    NEW.total_ratings := OLD.total_ratings;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_protect_tutor_ratings ON public.tutors;
CREATE TRIGGER trigger_protect_tutor_ratings
  BEFORE UPDATE ON public.tutors
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_tutor_ratings();

-- 4. Secure the resources bucket (Sets public = false)
UPDATE storage.buckets
SET public = false
WHERE id = 'resources';
