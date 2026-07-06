-- Create system_feedback table
CREATE TABLE IF NOT EXISTS public.system_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending'
);

ALTER TABLE public.system_feedback ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert feedback
CREATE POLICY "system_feedback_insert" ON public.system_feedback
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow admins to read feedback
CREATE POLICY "system_feedback_select_admin" ON public.system_feedback
  FOR SELECT USING (public.is_admin(auth.uid()));

-- Allow admins to update feedback status
CREATE POLICY "system_feedback_update_admin" ON public.system_feedback
  FOR UPDATE USING (public.is_admin(auth.uid()));


-- Fix profiles RLS to prevent public read of PII
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_auth" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');
