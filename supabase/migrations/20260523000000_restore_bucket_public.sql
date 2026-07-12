SET statement_timeout = 0;
-- Restore resources bucket to public visibility
-- This fixes the "Bucket not found" error for Google Docs viewer and restores native PDF previews
UPDATE storage.buckets
SET public = true
WHERE id = 'resources';

