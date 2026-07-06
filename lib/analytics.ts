/**
 * Telemetry and Analytics Wrapper
 * Future implementation can connect to Mixpanel/PostHog/etc.
 */

export const analytics = {
  track: (eventName: string, properties?: Record<string, any>) => {
    // In the future: mixpanel.track(eventName, properties)
    if (process.env.NODE_ENV === "development") {
      console.log(`[Analytics] Track: ${eventName}`, properties || {});
    }
  },
  identify: (userId: string, traits?: Record<string, any>) => {
    // In the future: mixpanel.identify(userId)
    if (process.env.NODE_ENV === "development") {
      console.log(`[Analytics] Identify: ${userId}`, traits || {});
    }
  },
  page: (pageName: string) => {
    // In the future: mixpanel.track("Page View", { page: pageName })
    if (process.env.NODE_ENV === "development") {
      console.log(`[Analytics] Page View: ${pageName}`);
    }
  },
};
