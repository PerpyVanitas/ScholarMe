import { describe, it, expect } from "vitest";
import {
  calcMinutes,
  formatDuration,
} from "@/app/dashboard/admin/timesheets/components/timesheets-table";

describe("Timesheet Utilities", () => {
  describe("calcMinutes", () => {
    it("should calculate exact minutes between two timestamps", () => {
      const clockIn = "2026-07-13T08:00:00Z";
      const clockOut = "2026-07-13T09:30:00Z";
      expect(calcMinutes(clockIn, clockOut)).toBe(90);
    });

    it("should handle partial minutes correctly", () => {
      const clockIn = "2026-07-13T08:00:00Z";
      const clockOut = "2026-07-13T08:01:30Z";
      expect(calcMinutes(clockIn, clockOut)).toBe(1.5);
    });

    it("should return 0 if clockOut is before clockIn (invalid state)", () => {
      const clockIn = "2026-07-13T09:00:00Z";
      const clockOut = "2026-07-13T08:00:00Z";
      expect(calcMinutes(clockIn, clockOut)).toBe(0); // Assuming the logic handles Math.max(0, ...)
    });
  });

  describe("formatDuration", () => {
    it("should format minutes less than 1 hour", () => {
      expect(formatDuration(45)).toBe("45m");
    });

    it("should format exactly 1 hour", () => {
      expect(formatDuration(60)).toBe("1h 0m");
    });

    it("should format hours and minutes", () => {
      expect(formatDuration(90)).toBe("1h 30m");
      expect(formatDuration(125)).toBe("2h 5m");
    });

    it("should round decimal minutes", () => {
      expect(formatDuration(60.4)).toBe("1h 0m");
      expect(formatDuration(60.6)).toBe("1h 1m");
    });
  });
});
