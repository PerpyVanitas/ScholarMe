import { createClient } from "@supabase/supabase-js";

export const hasTestDb = !!(
  process.env.TEST_SUPABASE_URL && process.env.TEST_SUPABASE_SERVICE_ROLE_KEY
);

export function getTestClient() {
  if (!hasTestDb) {
    throw new Error("Test DB not configured");
  }
  return createClient(
    process.env.TEST_SUPABASE_URL!,
    process.env.TEST_SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// Generate random strings to avoid collisions in tests
export function randomSuffix() {
  return Math.random().toString(36).substring(7);
}
