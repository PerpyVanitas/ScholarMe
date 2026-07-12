SET statement_timeout = 0;
CREATE OR REPLACE FUNCTION public.generate_unique_id_number()
RETURNS trigger AS $$
DECLARE
  prefix text;
  next_seq integer;
BEGIN
  -- If academic_year_joined is NULL, clear unique ID and return
  IF NEW.academic_year_joined IS NULL THEN
    NEW.unique_id_number := NULL;
    RETURN NEW;
  END IF;

  -- Only generate if it is not set yet or if academic_year_joined changed
  IF NEW.unique_id_number IS NOT NULL AND (OLD.academic_year_joined = NEW.academic_year_joined OR OLD IS NULL) THEN
    RETURN NEW;
  END IF;

  -- Determine president initials and short year suffix
  IF NEW.academic_year_joined = '2022-2023' THEN
    prefix := 'VAM-2223-';
  ELSIF NEW.academic_year_joined = '2023-2024' THEN
    prefix := 'JVN-2324-';
  ELSIF NEW.academic_year_joined = '2024-2025' THEN
    prefix := 'VWP-2425-';
  ELSIF NEW.academic_year_joined = '2025-2026' THEN
    prefix := 'AFC-2526-';
  ELSIF NEW.academic_year_joined = '2026-2027' THEN
    prefix := 'MJJ-2627-';
  ELSE
    prefix := 'HS-' || replace(NEW.academic_year_joined, '-', '') || '-';
  END IF;

  -- Find the next sequence number for this prefix
  SELECT COALESCE(MAX(SUBSTRING(unique_id_number FROM '[0-9]+$')::integer), 0) + 1
  INTO next_seq
  FROM public.profiles
  WHERE unique_id_number LIKE prefix || '%';

  -- Format the unique code
  NEW.unique_id_number := prefix || LPAD(next_seq::text, 3, '0');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger a re-generation for all 2026-2027 users who were assigned the generic fallback prefix
UPDATE public.profiles
SET unique_id_number = NULL, academic_year_joined = academic_year_joined
WHERE academic_year_joined = '2026-2027' AND unique_id_number LIKE 'HS-20262027-%';

