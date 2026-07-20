-- Create a table for storing resource chunks and embeddings
CREATE TABLE IF NOT EXISTS resource_embeddings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id uuid NOT NULL REFERENCES library_resources(id) ON DELETE CASCADE,
    profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content text NOT NULL,
    embedding jsonb, -- Storing the array of floats as JSONB instead of pgvector to avoid extension permission issues
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
