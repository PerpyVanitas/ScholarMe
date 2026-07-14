import { describe, it, expect } from "vitest";
import { TimesheetCorrectionSchema } from "../../timesheets/schema";
import { calcMinutes } from "../../../app/dashboard/admin/timesheets/components/timesheets-table";

describe("Timesheets Math and Schema", () => {
  it("P2-3: Negative duration rejected (clock_out < clock_in)", () => {
    const result = TimesheetCorrectionSchema.safeParse({
      timesheet_id: "00000000-0000-0000-0000-000000000000",
      original_clock_in: "2024-03-01T12:00:00Z",
      requested_clock_out: "2024-03-01T10:00:00Z", // 2 hours before clock in
      reason: "Forgot to clock out",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain(
        "Negative duration rejected",
      );
    }
  });

  it("P2-8: Zero-minute shift rejected", () => {
    const result = TimesheetCorrectionSchema.safeParse({
      timesheet_id: "00000000-0000-0000-0000-000000000000",
      original_clock_in: "2024-03-01T12:00:00Z",
      requested_clock_out: "2024-03-01T12:00:30Z", // 30 seconds
      reason: "Forgot to clock out",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain(
        "Zero-minute shift rejected",
      );
    }
  });

  it("P2-7: Timesheet math - midnight boundary", () => {
    // Clock in 23:50, clock out 00:10 next day -> duration = 20 minutes
    const clockIn = "2024-03-01T23:50:00Z";
    const clockOut = "2024-03-02T00:10:00Z";

    const minutes = calcMinutes(clockIn, clockOut);
    expect(minutes).toBe(20);
  });
});
