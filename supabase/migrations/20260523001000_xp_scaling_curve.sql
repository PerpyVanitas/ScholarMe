SET statement_timeout = 0;
-- Drop the existing function first just to be safe if the signature changed, but OR REPLACE usually handles it.
CREATE OR REPLACE FUNCTION public.update_profile_level()
RETURNS TRIGGER AS $$
BEGIN
  -- We update both total_xp and recalculate current_level using an exponential scale
  -- Level = FLOOR(0.1 * SQRT(total_xp)) + 1
  -- This makes leveling up progressively harder.
  UPDATE public.profiles
  SET
    total_xp = total_xp + NEW.amount,
    current_level = floor(0.1 * sqrt(total_xp + NEW.amount)) + 1
  WHERE id = NEW.profile_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- To ensure the UI updates existing profiles correctly, we should also retroactively recalculate current_level for all profiles
UPDATE public.profiles
SET current_level = floor(0.1 * sqrt(total_xp)) + 1;

