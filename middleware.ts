/**
 * ==========================================================================
 * NEXT.JS MIDDLEWARE - Entry Point
 * ==========================================================================
 *
 * PURPOSE: This is the root middleware file that Next.js automatically runs
 * on every matching request. It delegates to the Supabase middleware helper
 * which refreshes auth tokens and (optionally) protects routes.
 *
 * The `config.matcher` pattern excludes static files (images, CSS, JS bundles)
 * from middleware processing for performance. Only actual page/API requests
 * go through the middleware.
 *
 * FLOW: Browser Request -> middleware.ts -> updateSession() -> Page renders
 * ==========================================================================
 */
import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

/**
 * Matcher pattern: Run middleware on ALL routes EXCEPT static files.
 * This regex excludes: _next/static, _next/image, favicon.ico, and
 * any file with an image extension (.svg, .png, .jpg, etc.)
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
