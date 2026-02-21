-- Auth cards for Card ID + PIN authentication
CREATE TABLE IF NOT EXISTS public.auth_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  card_id text NOT NULL UNIQUE,
  pin text NOT NULL, -- bcrypt hashed
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  issued_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.auth_cards ENABLE ROW LEVEL SECURITY;

-- Admins can do everything with cards
CREATE POLICY "auth_cards_admin_all" ON public.auth_cards
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.name = 'administrator'
    )
  );

-- Users can read their own card
CREATE POLICY "auth_cards_select_own" ON public.auth_cards
  FOR SELECT USING (auth.uid() = user_id);
