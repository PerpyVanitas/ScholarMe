/** Root proxy -- delegates to Supabase session refresh. */
import { updateSession } from "@/lib/supabase/middleware"
import { type NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

// Also export as default for compatibility
export default proxy

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
