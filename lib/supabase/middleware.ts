/**
 * Supabase Authentication Middleware
 * 
 * Handles session management and route protection for the Next.js application:
 * - Refreshes JWT tokens automatically on each request
 * - Redirects unauthenticated users from protected routes to login
 * - Redirects authenticated users away from auth pages to dashboard
 * 
 * @see proxy.ts - Next.js 16 proxy file that invokes this middleware
 */
import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

/** Routes requiring valid authentication session */
const PROTECTED_ROUTES = ["/dashboard"]

/** Routes accessible only to unauthenticated users (login, signup, etc.) */
const AUTH_ROUTES = ["/auth/login", "/auth/sign-up", "/auth/card-login"]

/** Routes accessible to all users regardless of auth state */
const PUBLIC_ROUTES = ["/", "/auth/callback", "/auth/error"]

/**
 * Validates and refreshes the user session, then enforces route protection.
 * 
 * @param request - Incoming Next.js request
 * @returns NextResponse - Either continues to route or redirects based on auth state
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // Initialize Supabase client with cookie-based session management
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
