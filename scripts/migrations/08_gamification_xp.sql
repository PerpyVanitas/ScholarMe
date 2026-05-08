CREATE TABLE IF NOT EXISTS public.xp_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  reason text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.xp_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "xp_logs_own_read" ON public.xp_logs;
CREATE POLICY "xp_logs_own_read" ON public.xp_logs
  FOR SELECT USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "xp_logs_insert_any" ON public.xp_logs;
CREATE POLICY "xp_logs_insert_any" ON public.xp_logs
  FOR INSERT WITH CHECK (true);

CREATE OR REPLACE FUNCTION update_profile_level()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET
    total_xp = total_xp + NEW.amount,
    current_level = floor((total_xp + NEW.amount) / 1000) + 1
  WHERE id = NEW.profile_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_profile_level ON public.xp_logs;
CREATE TRIGGER trigger_update_profile_level
  AFTER INSERT ON public.xp_logs
  FOR EACH ROW EXECUTE FUNCTION update_profile_level();