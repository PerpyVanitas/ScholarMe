-- Add super_admin to hs_designations designation check constraint
ALTER TABLE public.hs_designations DROP CONSTRAINT IF EXISTS hs_designations_designation_check;
ALTER TABLE public.hs_designations ADD CONSTRAINT hs_designations_designation_check CHECK (designation IN ('member', 'esas_scholar', 'officer', 'administrator', 'super_admin'));
