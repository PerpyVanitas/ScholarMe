/**
 * Structured logger (P8-2) — wraps pino with ScholarMe-specific defaults.
 *
 * Usage in API routes:
 *   import { logger } from "@/lib/logger";
 *   logger.error({ route: "/api/v1/sessions", userId }, "Session creation failed");
 *
 * Log levels: trace < debug < info < warn < error < fatal
 */
import pino from "pino";
import * as crypto from "crypto";

const isDev = process.env.NODE_ENV === "development";

export const logger = pino({
  level: isDev ? "debug" : "info",
  // In development, pretty-print. In production (Vercel), output JSON for log aggregators.
  ...(isDev
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "HH:MM:ss.l", ignore: "pid,hostname" },
        },
      }
    : {}),
});

/**
 * Hash a userId for structured logs.
 * We log hashed IDs so logs can be correlated without exposing raw UUIDs
 * if log streams are accidentally shared. NOT used for security purposes.
 */
export function hashUserId(userId: string): string {
  return crypto.createHash("sha256").update(userId).digest("hex").slice(0, 16);
}

/**
 * Create a child logger pre-tagged with route context.
 *
 * Usage:
 *   const log = routeLogger("/api/v1/sessions");
 *   log.error({ userId: hashUserId(user.id) }, "Unauthorized access attempt");
 */
export function routeLogger(route: string) {
  return logger.child({ route });
}

/**
 * Create a child logger tagged with the request ID for tracing.
 */
export function reqLogger(request: Request, route?: string) {
  const requestId = request.headers.get("x-request-id") || "unknown";
  return logger.child({ 
    requestId,
    ...(route ? { route } : {})
  });
}
