ALTER TABLE public.study_set_items
ADD COLUMN image_url text,
ADD COLUMN occlusion_masks jsonb;
