/**
 * ==========================================================================
 * SUPABASE SERVER CLIENT
 * ==========================================================================
 *
 * PURPOSE: Creates Supabase clients for use in SERVER-SIDE code:
 * - Server Components (app/dashboard/page.tsx, etc.)
 * - Server Actions ("use server" functions)
 * - API Route Handlers (app/api/*/route.ts)
 *
 * PROVIDES TWO CLIENTS:
 *
 * 1. createClient() - NORMAL client (respects Row Level Security)
 *    - Uses the ANON_KEY, same as browser client
 *    - Can only access data that RLS policies allow for the current user
 *    - Use this for 99% of server-side operations
 *
 * 2. createAdminClient() - ADMIN client (bypasses Row Level Security)
 *    - Uses the SERVICE_ROLE_KEY which has FULL database access
 *    - DANGEROUS: bypasses all security policies
 *    - Only use for admin operations (creating users, looking up cards, etc.)
 *    - NEVER expose the SERVICE_ROLE_KEY to the client/browser
 *
 * HOW COOKIES WORK HERE:
 * - Server Components can READ cookies but NOT SET them (read-only context)
 * - That's why setAll() has a try/catch that silently fails in Server Components
 * - Middleware handles the actual cookie setting for auth token refresh
 * - Server Actions and Route Handlers CAN set cookies, so setAll works there
 * ==========================================================================
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a NORMAL Supabase server client that respects Row Level Security.
 * IMPORTANT: This is an async function because `cookies()` is async in Next.js 16.
 * Always: `const supabase = await createClient();`
 */
export async function createClient() {
  // Next.js 16: cookies() must be awaited (it's a Promise now)
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Supabase reads cookies to find the user's auth session token
        getAll() {
          return cookieStore.getAll();
        },
        // Supabase writes cookies to refresh expired auth tokens
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // EXPECTED ERROR: This fires when called from a Server Component
            // (which is read-only for cookies). The middleware handles token
            // refresh instead, so this silent failure is safe.
          }
        },
      },
    }
  );
}

/**
 * Creates an ADMIN Supabase client that BYPASSES all Row Level Security.
 * WARNING: This has FULL unrestricted access to your database.
 *
 * ONLY USE FOR:
 * - Creating users via admin API (POST /api/admin/users)
 * - Looking up auth cards during card login (POST /api/auth/card-login)
 * - Any operation that needs to access data across all users
 */
export async function createAdminClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,  // SERVICE_ROLE_KEY bypasses RLS!
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Same as above -- silent failure in read-only Server Component context
          }
        },
      },
    }
  );
}
