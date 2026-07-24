/**
 * Telemetry wrapper — persists events to analytics_logs via API.
 * Supports optional PostHog when NEXT_PUBLIC_POSTHOG_KEY is set.
 */

type AnalyticsProperties = Record<string, unknown>;
import { logger } from "./logger";

function sendToApi(payload: {
  event?: string;
  properties?: AnalyticsProperties;
  page?: string;
}) {
  if (typeof window === "undefined") return;

  fetch("/api/v1/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {});

  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthog = (window as Window & { posthog?: { capture: (name: string, props?: Record<string, unknown>) => void } }).posthog;
  
  if (posthogKey && posthog) {
    if (payload.page) {
      posthog.capture("$pageview", { page: payload.page });
    } else if (payload.event) {
      posthog.capture(payload.event, payload.properties as Record<string, unknown>);
    }
  }
}

export const analytics = {
  track: (eventName: string, properties?: AnalyticsProperties) => {
    sendToApi({ event: eventName, properties });
    if (process.env.NODE_ENV === "development") {
      logger.debug({ properties }, `[Analytics] Track: ${eventName}`);
    }
  },
  identify: (userId: string, traits?: AnalyticsProperties) => {
    sendToApi({ event: "identify", properties: { userId, ...traits } });
    if (process.env.NODE_ENV === "development") {
      logger.debug({ traits }, `[Analytics] Identify: ${userId}`);
    }
  },
  page: (pageName: string) => {
    sendToApi({ page: pageName });
    if (process.env.NODE_ENV === "development") {
      logger.debug(`[Analytics] Page View: ${pageName}`);
    }
  },
};
