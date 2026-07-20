import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // 1. CORS Enforcement
  const origin = request.headers.get("origin") ?? "";
  const host = request.headers.get("host") ?? "";

  // Basic validation to only allow expected origins.
  // We allow same-origin requests (origin is empty or matches host)
  const isDevelopment = process.env.NODE_ENV === "development";
  const expectedOrigins = isDevelopment
    ? [`http://${host}`, `https://${host}`]
    : [`https://${host}`];

  const isApiRoute = request.nextUrl.pathname.startsWith("/api/");
  const isCorsPreflight = request.method === "OPTIONS";

  if (origin && !expectedOrigins.includes(origin)) {
    // If evil-site.com tries to make a request, block it.
    return new NextResponse(null, {
      status: 403,
      statusText: "Forbidden",
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }

  // 2. CSRF / Origin Validation for mutations
  const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(
    request.method,
  );
  if (isMutation && isApiRoute) {
    // Require valid Origin or Referer
    if (!origin || !expectedOrigins.includes(origin)) {
      // In a real app we might allow cross-origin for specific webhooks, but we block generic state mutations without correct origin
      const referer = request.headers.get("referer") ?? "";
      if (
        !referer.startsWith(`http://${host}`) &&
        !referer.startsWith(`https://${host}`)
      ) {
        return new NextResponse(null, {
          status: 403,
          statusText: "Forbidden: CSRF protection",
          headers: {
            "Content-Type": "text/plain",
          },
        });
      }
    }
  }

  // Generate a nonce for CSP
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  // Run Supabase Auth Middleware to refresh session and protect routes
  let response: NextResponse;
  if (isCorsPreflight) {
    response = new NextResponse(null, { status: 204 });
  } else {
    // Call updateSession which handles session refresh and auth redirects
    response = await updateSession(request);
  }

  if (origin && expectedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );
  }

  // 3. Set CSP Headers
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'unsafe-eval';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://hebbkx1anhila5yf.public.blob.vercel-storage.com;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    block-all-mixed-content;
    upgrade-insecure-requests;
  `
    .replace(/\s{2,}/g, " ")
    .trim();

  response.headers.set("Content-Security-Policy", cspHeader);
  // Pass nonce to Next.js via x-nonce header so it can be read in server components if needed
  response.headers.set("x-nonce", nonce);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
