import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/**
 * Creates a request-scoped Supabase client that forwards the authenticated user's
 * JWT bearer token. This ensures that Supabase evaluates RLS (Row Level Security)
 * rules with the correct auth.uid() context.
 */
export function createSupabaseForBearer(token: string) {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}
