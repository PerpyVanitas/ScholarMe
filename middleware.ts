import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // First, generate the request ID
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  
  // Update the request headers so that down-stream server components get it
  request.headers.set('x-request-id', requestId);

  // Run the Supabase update session which returns a response
  const response = await updateSession(request);
  
  // Attach the request ID to the outgoing response headers as well
  response.headers.set('x-request-id', requestId);
  
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
