/**
 * ==========================================================================
 * SUPABASE CLIENT (Browser / Client-Side)
 * ==========================================================================
 *
 * PURPOSE: Creates a Supabase client for use in CLIENT COMPONENTS ("use client").
 * This is the client that runs in the user's browser.
 *
 * WHEN TO USE:
 * - Inside components marked with "use client" (e.g., forms, interactive UIs)
 * - For client-side data fetching (useEffect, event handlers)
 * - Example: The Tutors page fetches tutor data in useEffect using this client
 *
 * WHEN NOT TO USE:
 * - In Server Components or API routes -- use lib/supabase/server.ts instead
 * - In middleware -- use lib/supabase/middleware.ts instead
 *
 * HOW IT WORKS:
 * - createBrowserClient() from @supabase/ssr automatically handles cookies
 *   in the browser, so auth state (login sessions) persists across page loads
 * - The NEXT_PUBLIC_ prefix makes these env vars available in the browser
 * - The "!" asserts these values exist (they're set by the Supabase integration)
 *
 * SECURITY NOTE:
 * - The ANON_KEY is safe to expose in the browser -- it only allows access
 *   that Row Level Security (RLS) policies permit
 * - Never expose SUPABASE_SERVICE_ROLE_KEY in client code
 * ==========================================================================
 */
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,   // Your Supabase project URL (e.g., https://xxx.supabase.co)
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!  // Public anonymous key (safe for browser)
  );
}
