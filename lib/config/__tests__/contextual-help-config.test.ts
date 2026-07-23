import { describe, it, expect } from "vitest";
import { getHelpForRoute, ROUTE_HELP_MAP } from "../contextual-help-config";

describe("Contextual Help Config", () => {
  it("returns exact match for configured routes", () => {
    const helpInfo = getHelpForRoute("/dashboard/journey");
    expect(helpInfo.title).toBe("My Journey");
    expect(helpInfo.actions).toHaveLength(3);
  });

  it("returns exact match for dashboard home", () => {
    const helpInfo = getHelpForRoute("/dashboard/home");
    expect(helpInfo.title).toBe("Dashboard Home");
  });

  it("prioritizes longest prefix match for dynamic nested routes", () => {
    const helpInfo = getHelpForRoute("/dashboard/network/mentorship/settings");
    expect(helpInfo.title).toBe("Mentorship Matching");
  });

  it("returns default fallback help info for unconfigured routes", () => {
    const helpInfo = getHelpForRoute("/dashboard/unknown-page");
    expect(helpInfo.title).toBe("ScholarMe Page Help");
    expect(helpInfo.actions).toHaveLength(2);
  });
});
