/**
 * Next.js Middleware — Supabase session refresh.
 *
 * Required export name is `middleware` (not `proxy`, not `default`-only).
 * Next.js reads the named export `middleware` from this file.
 */
import { updateSession } from "@/lib/supabase/middleware"
import { type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
