CREATE TABLE IF NOT EXISTS public.weekly_challenges (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text NOT NULL,
    target_amount integer NOT NULL DEFAULT 0,
    current_progress integer NOT NULL DEFAULT 0,
    xp_reward_multiplier numeric(3,1) NOT NULL DEFAULT 1.0,
    end_date timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.weekly_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Weekly challenges are viewable by everyone" 
ON public.weekly_challenges FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage weekly challenges"
ON public.weekly_challenges
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));
