/** Server-side Supabase clients for RSC, Server Actions, and API routes. */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Normal client -- respects Row Level Security. */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Silent in read-only Server Component context; middleware handles refresh.
          }
        },
      },
    }
  )
}

/** Admin client -- bypasses RLS. Only use for admin ops and card-login lookups. */
export async function createAdminClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Silent in read-only context.
          }
        },
      },
    }
  )
}
