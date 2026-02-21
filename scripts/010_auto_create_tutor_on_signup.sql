-- Update the handle_new_user trigger to auto-create a tutors record when role is "tutor"
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_role_id uuid;
  resolved_role_id uuid;
  resolved_role_name text;
BEGIN
  SELECT id INTO default_role_id FROM public.roles WHERE name = 'learner';

  resolved_role_id := COALESCE(
    (new.raw_user_meta_data ->> 'role_id')::uuid,
    default_role_id
  );

  INSERT INTO public.profiles (id, role_id, full_name, email)
  VALUES (
    new.id,
    resolved_role_id,
    COALESCE(new.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(new.email, '')
  )
  ON CONFLICT (id) DO NOTHING;

  -- Auto-create tutors record if the chosen role is "tutor"
  SELECT name INTO resolved_role_name FROM public.roles WHERE id = resolved_role_id;

  IF resolved_role_name = 'tutor' THEN
    INSERT INTO public.tutors (user_id)
    VALUES (new.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$;
