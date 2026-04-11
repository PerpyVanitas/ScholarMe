/** Supabase middleware helper -- refreshes auth tokens on every request. */
import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Routes that require authentication
const PROTECTED_ROUTES = ["/dashboard"]

// Routes only for unauthenticated users
const AUTH_ROUTES = ["/auth/login", "/auth/sign-up", "/auth/card-login"]

// Routes that are always public
const PUBLIC_ROUTES = ["/", "/auth/callback", "/auth/error"]

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
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // Supabase unreachable -- skip auth guards, don't block request.
    return supabaseResponse
  }

  const { pathname } = request.nextUrl

  // Check if route is protected and user is not authenticated
  const isProtectedRoute = PROTECTED_ROUTES.some(route => 
    pathname.startsWith(route)
  )
  
  if (isProtectedRoute && !user) {
    // Redirect to login with return URL
    const redirectUrl = new URL("/auth/login", request.url)
    redirectUrl.searchParams.set("redirectTo", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Check if route is auth-only and user is already authenticated
  const isAuthRoute = AUTH_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route)
  )
  
  if (isAuthRoute && user) {
    // Redirect authenticated users away from auth pages
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return supabaseResponse
}
