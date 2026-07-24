import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  // 0. Request ID Generation
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  request.headers.set("x-request-id", requestId);

  // 1. CORS Enforcement
  const origin = request.headers.get("origin") ?? "";
  const host = request.headers.get("host") ?? "";

  const isDevelopment =
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV !== "production";
  const expectedOrigins = isDevelopment
    ? [`http://${host}`, `https://${host}`]
    : [`https://${host}`];

  const isApiRoute = request.nextUrl.pathname.startsWith("/api/v1/");
  const isCorsPreflight = request.method === "OPTIONS";

  if (origin && !expectedOrigins.includes(origin)) {
    return new NextResponse(null, {
      status: 403,
      statusText: "Forbidden",
      headers: { "Content-Type": "text/plain" },
    });
  }

  // 2. CSRF / Origin Validation for mutations
  const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(
    request.method,
  );
  if (isMutation && isApiRoute) {
    if (!origin || !expectedOrigins.includes(origin)) {
      const referer = request.headers.get("referer") ?? "";
      if (
        !referer.startsWith(`http://${host}`) &&
        !referer.startsWith(`https://${host}`)
      ) {
        return new NextResponse(null, {
          status: 403,
          statusText: "Forbidden: CSRF protection",
          headers: { "Content-Type": "text/plain" },
        });
      }
    }
  }

  // 3. Set CSP Headers
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  // WebLLM requires 'unsafe-eval' and 'strict-dynamic' can be useful
  // In development, Next.js requires 'unsafe-inline' for fast refresh and hydration
  const scriptSrc = isDevelopment
    ? `'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'`
    : `'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval' 'wasm-unsafe-eval'`;

  const cspHeader = `
    default-src 'self';
    script-src ${scriptSrc};
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https: https://hebbkx1anhila5yf.public.blob.vercel-storage.com;
    font-src 'self' data:;
    connect-src 'self' https: wss:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `
    .replace(/\s{2,}/g, " ")
    .trim();

  // Run Supabase auth session refresh and route protection
  const response = isCorsPreflight
    ? new NextResponse(null, { status: 204 })
    : await updateSession(request);

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

  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set("x-nonce", nonce);
  response.headers.set("x-pathname", request.nextUrl.pathname);
  response.headers.set("x-request-id", requestId);

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
