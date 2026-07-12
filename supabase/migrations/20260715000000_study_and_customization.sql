CREATE TABLE IF NOT EXISTS public.roadmap_items (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in-progress', 'completed')),
    upvotes integer NOT NULL DEFAULT 0,
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.roadmap_upvotes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    roadmap_item_id uuid NOT NULL REFERENCES public.roadmap_items(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id),
    UNIQUE(roadmap_item_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.organization_settings (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    primary_color text NOT NULL DEFAULT '#0f172a',
    logo_url text,
    hero_title text NOT NULL DEFAULT 'Empowering Your Academic Journey',
    hero_subtitle text NOT NULL DEFAULT 'Join our platform to master your subjects with AI-driven tools.',
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.support_tickets (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'resolved')),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.support_messages (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

-- RLS
ALTER TABLE public.roadmap_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view roadmap" ON public.roadmap_items FOR SELECT USING (true);
CREATE POLICY "Admins can manage roadmap" ON public.roadmap_items FOR ALL USING (
  EXISTS (
    SELECT 1 FROM roles JOIN profiles ON profiles.role_id = roles.id 
    WHERE profiles.id = auth.uid() AND roles.name IN ('administrator', 'super_admin')
  )
);

CREATE POLICY "Anyone can view upvotes" ON public.roadmap_upvotes FOR SELECT USING (true);
CREATE POLICY "Users can insert upvotes" ON public.roadmap_upvotes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own upvotes" ON public.roadmap_upvotes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view settings" ON public.organization_settings FOR SELECT USING (true);
CREATE POLICY "Super admins can manage settings" ON public.organization_settings FOR ALL USING (
  EXISTS (
    SELECT 1 FROM roles JOIN profiles ON profiles.role_id = roles.id 
    WHERE profiles.id = auth.uid() AND roles.name = 'super_admin'
  )
);

CREATE POLICY "Users can view own tickets" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all tickets" ON public.support_tickets FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM roles JOIN profiles ON profiles.role_id = roles.id 
    WHERE profiles.id = auth.uid() AND roles.name IN ('administrator', 'super_admin')
  )
);
CREATE POLICY "Users can create tickets" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update tickets" ON public.support_tickets FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM roles JOIN profiles ON profiles.role_id = roles.id 
    WHERE profiles.id = auth.uid() AND roles.name IN ('administrator', 'super_admin')
  )
);

CREATE POLICY "Users can view own ticket messages" ON public.support_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
);
CREATE POLICY "Admins can view all ticket messages" ON public.support_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM roles JOIN profiles ON profiles.role_id = roles.id 
    WHERE profiles.id = auth.uid() AND roles.name IN ('administrator', 'super_admin')
  )
);
CREATE POLICY "Users can send messages to own tickets" ON public.support_messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND (t.user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM roles JOIN profiles ON profiles.role_id = roles.id 
    WHERE profiles.id = auth.uid() AND roles.name IN ('administrator', 'super_admin')
  )))
);

CREATE OR REPLACE FUNCTION public.increment_roadmap_upvote(item_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.roadmap_items
  SET upvotes = upvotes + 1
  WHERE id = item_id;
$$;
