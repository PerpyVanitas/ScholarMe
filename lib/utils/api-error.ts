import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

/**
 * Safely handle an unexpected API error:
 * 1. Captures the real error in Sentry.
 * 2. Logs to the server console for debugging.
 * 3. Returns ONLY a generic message to the client — never raw error.message.
 *
 * @param error  - The caught error (unknown type)
 * @param status - HTTP status code to return (default 500)
 */
export function handleApiError(error: unknown, status: number = 500): NextResponse {
  Sentry.captureException(error);
  console.error("[api] Unexpected error:", error);

  const message =
    status === 404
      ? "Resource not found"
      : "An unexpected error occurred. Please try again.";

  return NextResponse.json({ error: message }, { status });
}
