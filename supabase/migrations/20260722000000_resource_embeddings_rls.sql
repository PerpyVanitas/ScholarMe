-- Enable RLS on resource_embeddings table
ALTER TABLE public.resource_embeddings ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own embeddings
CREATE POLICY "Users can view their own resource embeddings"
  ON public.resource_embeddings
  FOR SELECT
  USING (auth.uid() = profile_id);

-- Allow users to insert their own embeddings
CREATE POLICY "Users can insert their own resource embeddings"
  ON public.resource_embeddings
  FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

-- Allow users to update their own embeddings
CREATE POLICY "Users can update their own resource embeddings"
  ON public.resource_embeddings
  FOR UPDATE
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- Allow users to delete their own embeddings
CREATE POLICY "Users can delete their own resource embeddings"
  ON public.resource_embeddings
  FOR DELETE
  USING (auth.uid() = profile_id);
