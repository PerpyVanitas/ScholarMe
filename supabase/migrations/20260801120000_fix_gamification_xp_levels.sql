-- Fix Gamification XP and Level calculation function and trigger
-- Ensures total_xp is never NULL and level updates correctly on every xp_logs insert

CREATE OR REPLACE FUNCTION public.update_profile_level()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET
    total_xp = COALESCE(total_xp, 0) + NEW.amount,
    current_level = floor(0.1 * sqrt(COALESCE(total_xp, 0) + NEW.amount)) + 1
  WHERE id = NEW.profile_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_profile_level ON public.xp_logs;
CREATE TRIGGER trigger_update_profile_level
  AFTER INSERT ON public.xp_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_profile_level();

-- Retroactively fix all existing profiles to ensure total_xp is non-NULL and current_level matches XP curve
UPDATE public.profiles
SET
  total_xp = COALESCE(total_xp, 0),
  current_level = floor(0.1 * sqrt(COALESCE(total_xp, 0))) + 1
WHERE total_xp IS NULL
   OR current_level IS NULL
   OR current_level <> (floor(0.1 * sqrt(COALESCE(total_xp, 0))) + 1);
