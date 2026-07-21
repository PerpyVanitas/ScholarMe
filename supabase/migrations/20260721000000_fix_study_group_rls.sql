-- Fix infinite recursion in study_groups and study_group_members RLS policies

-- 1. Drop existing recursive policies
DROP POLICY IF EXISTS "Public groups are viewable by everyone" ON public.study_groups;
DROP POLICY IF EXISTS "Members can view members" ON public.study_group_members;

-- 2. Create a SECURITY DEFINER function to check membership without triggering RLS
CREATE OR REPLACE FUNCTION public.is_study_group_member(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM study_group_members
    WHERE group_id = p_group_id AND user_id = p_user_id
  );
$$;

-- 3. Create a SECURITY DEFINER function to check if a group is public without triggering RLS
CREATE OR REPLACE FUNCTION public.is_study_group_public(p_group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM study_groups
    WHERE id = p_group_id AND is_public = true
  );
$$;

-- 4. Recreate policies using the SECURITY DEFINER functions
CREATE POLICY "Public groups are viewable by everyone" 
ON public.study_groups 
FOR SELECT 
USING (
  is_public = true 
  OR public.is_study_group_member(id, auth.uid())
);

CREATE POLICY "Members can view members" 
ON public.study_group_members 
FOR SELECT 
USING (
  public.is_study_group_public(group_id) 
  OR auth.uid() = user_id 
  OR public.is_study_group_member(group_id, auth.uid())
);
