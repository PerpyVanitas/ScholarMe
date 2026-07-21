/**
 * Telemetry wrapper — persists events to analytics_logs via API.
 * Supports optional PostHog when NEXT_PUBLIC_POSTHOG_KEY is set.
 */

type AnalyticsProperties = Record<string, unknown>;

function sendToApi(payload: {
  event?: string;
  properties?: AnalyticsProperties;
  page?: string;
}) {
  if (typeof window === "undefined") return;

  fetch("/api/analytics/track", {
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
      console.log(`[Analytics] Track: ${eventName}`, properties || {});
    }
  },
  identify: (userId: string, traits?: AnalyticsProperties) => {
    sendToApi({ event: "identify", properties: { userId, ...traits } });
    if (process.env.NODE_ENV === "development") {
      console.log(`[Analytics] Identify: ${userId}`, traits || {});
    }
  },
  page: (pageName: string) => {
    sendToApi({ page: pageName });
    if (process.env.NODE_ENV === "development") {
      console.log(`[Analytics] Page View: ${pageName}`);
    }
  },
};
