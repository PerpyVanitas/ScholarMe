-- Phase 21: Library and Waitlists

-- Physical Resources (Library Catalog)
CREATE TABLE IF NOT EXISTS public.physical_resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT,
  isbn TEXT,
  resource_type TEXT NOT NULL DEFAULT 'book', -- 'book', 'calculator', 'equipment'
  cover_image_url TEXT,
  total_quantity INTEGER NOT NULL DEFAULT 1,
  available_quantity INTEGER NOT NULL DEFAULT 1,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Resource Checkouts
CREATE TABLE IF NOT EXISTS public.resource_checkouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_id UUID NOT NULL REFERENCES public.physical_resources(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  checkout_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  return_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'returned', 'overdue', 'lost'
  notes TEXT,
  checked_out_by UUID NOT NULL REFERENCES public.profiles(id), -- Admin/Officer who processed it
  checked_in_by UUID REFERENCES public.profiles(id) -- Admin/Officer who processed return
);

-- Session Waitlists
CREATE TABLE IF NOT EXISTS public.session_waitlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tutor_id UUID NOT NULL REFERENCES public.tutors(id) ON DELETE CASCADE,
  learner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requested_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting', -- 'waiting', 'notified', 'fulfilled', 'cancelled'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- RLS
ALTER TABLE public.physical_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_checkouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_waitlists ENABLE ROW LEVEL SECURITY;

-- Everyone can view library catalog
CREATE POLICY "View physical resources" ON public.physical_resources
  FOR SELECT USING (true);

-- Only admins/officers can manage physical resources
CREATE POLICY "Manage physical resources" ON public.physical_resources
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.name IN ('administrator', 'super_admin', 'officer')
    )
  );

-- Users can view their own checkouts. Admins can view all checkouts.
CREATE POLICY "View resource checkouts" ON public.resource_checkouts
  FOR SELECT USING (
    profile_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.name IN ('administrator', 'super_admin', 'officer', 'tutor')
    )
  );

-- Only admins/officers can process checkouts
CREATE POLICY "Manage resource checkouts" ON public.resource_checkouts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.name IN ('administrator', 'super_admin', 'officer')
    )
  );

-- Users can join and leave waitlists for themselves
CREATE POLICY "Manage own waitlist entries" ON public.session_waitlists
  FOR ALL USING (
    learner_id = auth.uid()
  );

-- Tutors and admins can view waitlists
CREATE POLICY "View waitlists" ON public.session_waitlists
  FOR SELECT USING (
    tutor_id IN (SELECT id FROM public.tutors WHERE user_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.name IN ('administrator', 'super_admin', 'officer')
    )
  );
