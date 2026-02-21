/**
 * ==========================================================================
 * SUPABASE MIDDLEWARE - Session Refresh & Auth Guard
 * ==========================================================================
 *
 * PURPOSE: This runs on EVERY request (except static files) before the page loads.
 * It does two critical things:
 *
 * 1. REFRESHES AUTH TOKENS: Supabase auth tokens expire after 1 hour. This
 *    middleware silently refreshes them by calling getUser(), which triggers
 *    a token refresh if needed. The new tokens are written back to cookies
 *    via the setAll callback.
 *
 * 2. PROTECTS ROUTES (currently disabled for development):
 *    - Redirect unauthenticated users away from /dashboard to /auth/login
 *    - Redirect authenticated users away from /auth to /dashboard
 *    - These redirects are commented out to allow the demo/dev mode to work
 *
 * HOW THE COOKIE FLOW WORKS:
 * 1. Request comes in with existing cookies
 * 2. Supabase reads cookies via getAll() to find the auth session
 * 3. If tokens are expired, Supabase refreshes them
 * 4. New tokens are written via setAll() to BOTH:
 *    a. The request object (so downstream code sees fresh tokens)
 *    b. The response object (so the browser stores the fresh tokens)
 *
 * IMPORTANT: Without this middleware, auth sessions would break after 1 hour
 * because the access_token expires and wouldn't get refreshed.
 *
 * Called by: /middleware.ts (the Next.js middleware entry point)
 * ==========================================================================
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // Start with a "pass-through" response that doesn't modify anything
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Create a Supabase client specifically for the middleware context.
  // This client reads/writes cookies from the request/response objects
  // (not from Next.js's cookies() API, which isn't available in middleware).
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Read cookies from the incoming request
        getAll() {
          return request.cookies.getAll();
        },
        // When Supabase needs to set new cookies (e.g., refreshed tokens):
        setAll(cookiesToSet) {
          // Step 1: Set cookies on the request (for downstream server code)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Step 2: Create a new response with the updated request
          supabaseResponse = NextResponse.next({
            request,
          });
          // Step 3: Set cookies on the response (sent back to browser)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: This call does TWO things:
  // 1. Validates the current session (checks if user is logged in)
  // 2. Triggers token refresh if the access_token is expired
  // The side-effect of refreshing writes new cookies via setAll above.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── AUTH GUARDS (currently disabled for demo/dev mode) ──────────────
  // TODO: Re-enable these redirects when moving to production.
  // When enabled, they enforce:
  //   - /dashboard/* requires authentication (redirects to /auth/login)
  //   - /auth/* redirects to /dashboard if already logged in
  //
  // const pathname = request.nextUrl.pathname;
  // if (pathname.startsWith("/dashboard") && !user) {
  //   const url = request.nextUrl.clone();
  //   url.pathname = "/auth/login";
  //   return NextResponse.redirect(url);
  // }
  // if (pathname.startsWith("/auth") && user) {
  //   const url = request.nextUrl.clone();
  //   url.pathname = "/dashboard";
  //   return NextResponse.redirect(url);
  // }

  return supabaseResponse;
}
