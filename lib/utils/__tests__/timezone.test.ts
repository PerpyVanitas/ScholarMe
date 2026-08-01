import { describe, it, expect } from "vitest";
import { getLocalTimezone, formatTimeString, formatInLocalTimezone } from "../timezone";

describe("Timezone Utility", () => {
  it("detects local timezone string", () => {
    const tz = getLocalTimezone();
    expect(typeof tz).toBe("string");
    expect(tz.length).toBeGreaterThan(0);
  });

  it("formats 24-hour time strings into formatted 12-hour local time", () => {
    expect(formatTimeString("09:00")).toMatch(/9:00\s*AM/i);
    expect(formatTimeString("14:30")).toMatch(/2:30\s*PM/i);
    expect(formatTimeString("00:00")).toMatch(/12:00\s*AM/i);
  });

  it("formats ISO date strings in local timezone", () => {
    const iso = "2026-08-02T10:00:00Z";
    const formatted = formatInLocalTimezone(iso);
    expect(typeof formatted).toBe("string");
    expect(formatted.length).toBeGreaterThan(0);
  });

  it("handles invalid inputs gracefully", () => {
    expect(formatTimeString("")).toBe("");
    expect(formatInLocalTimezone("invalid-date")).toBe("");
  });
});
