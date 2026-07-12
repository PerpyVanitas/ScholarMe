SET statement_timeout = 0;
CREATE TABLE IF NOT EXISTS public.physical_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    isbn TEXT,
    available_copies INTEGER NOT NULL DEFAULT 1,
    total_copies INTEGER NOT NULL DEFAULT 1,
    location_shelf TEXT,
    cover_image_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.physical_books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view physical books" ON public.physical_books FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can insert physical books" ON public.physical_books;
CREATE POLICY "Admins can insert physical books" ON public.physical_books FOR INSERT WITH CHECK (
  public.is_admin(auth.uid())
);
DROP POLICY IF EXISTS "Admins can update physical books" ON public.physical_books;
CREATE POLICY "Admins can update physical books" ON public.physical_books FOR UPDATE USING (
  public.is_admin(auth.uid())
);
DROP POLICY IF EXISTS "Admins can delete physical books" ON public.physical_books;
CREATE POLICY "Admins can delete physical books" ON public.physical_books FOR DELETE USING (
  public.is_admin(auth.uid())
);


CREATE TABLE IF NOT EXISTS public.facility_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    color_code TEXT DEFAULT 'bg-blue-500',
    organizer_id UUID REFERENCES auth.users(id),
    is_mandatory BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.facility_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view events" ON public.facility_events FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins and Organizers can insert events" ON public.facility_events;
CREATE POLICY "Admins and Organizers can insert events" ON public.facility_events FOR INSERT WITH CHECK (
  auth.uid() = organizer_id OR public.is_admin(auth.uid())
);
DROP POLICY IF EXISTS "Admins and Organizers can update events" ON public.facility_events;
CREATE POLICY "Admins and Organizers can update events" ON public.facility_events FOR UPDATE USING (
  auth.uid() = organizer_id OR public.is_admin(auth.uid())
);

DROP TRIGGER IF EXISTS handle_updated_at ON public.physical_books;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.physical_books
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
  
DROP TRIGGER IF EXISTS handle_updated_at ON public.facility_events;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.facility_events
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

