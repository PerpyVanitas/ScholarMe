/** Root middleware -- rewrites /dashboard to /panel to bypass stale Turbopack cache, then delegates to Supabase session refresh. */
import { updateSession } from "@/lib/supabase/middleware"
import { type NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rewrite /dashboard/* to /panel/* (internal route) to bypass stale Turbopack cache
  // The URL bar still shows /dashboard but Next.js serves from /panel
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    const newPath = pathname.replace(/^\/dashboard/, "/panel")
    const url = request.nextUrl.clone()
    url.pathname = newPath
    const response = NextResponse.rewrite(url)
    // Copy cookies from supabase session refresh
    const supabaseResponse = await updateSession(request)
    supabaseResponse.cookies.getAll().forEach(cookie => {
      response.cookies.set(cookie.name, cookie.value)
    })
    return response
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
