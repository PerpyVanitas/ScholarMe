/** Supabase middleware helper -- refreshes auth tokens on every request. */
import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Validates session and triggers token refresh if expired.
  try {
    await supabase.auth.getUser()
  } catch {
    // Supabase unreachable -- skip auth, don't block request.
  }

  // TODO: Re-enable auth guards for production.
  // const { pathname } = request.nextUrl
  // if (pathname.startsWith("/dashboard") && !user) redirect to /auth/login
  // if (pathname.startsWith("/auth") && user) redirect to /dashboard

  return supabaseResponse
}
