import { describe, it, expect } from "vitest";

export function calculateTotalTutoringHours(
  completedSessionsCount: number,
  attendanceLogs: { clock_in: string; clock_out: string | null }[]
): number {
  const sessionHours = completedSessionsCount * 1;
  let totalAttendanceMinutes = 0;

  attendanceLogs.forEach((log) => {
    if (log.clock_in && log.clock_out) {
      const start = new Date(log.clock_in).getTime();
      const end = new Date(log.clock_out).getTime();
      totalAttendanceMinutes += Math.max(0, (end - start) / (1000 * 60));
    }
  });

  return sessionHours + Math.round(totalAttendanceMinutes / 60);
}

describe("Industry Readiness Summary Calculations", () => {
  it("calculates total tutoring hours combining sessions and clock-in attendance", () => {
    const logs = [
      { clock_in: "2026-07-23T10:00:00Z", clock_out: "2026-07-23T12:00:00Z" }, // 120 mins = 2h
      { clock_in: "2026-07-23T14:00:00Z", clock_out: "2026-07-23T15:30:00Z" }, // 90 mins = 1.5h
    ];
    // 5 sessions = 5h + 3.5h attendance = 8.5 -> round to 9h
    const total = calculateTotalTutoringHours(5, logs);
    expect(total).toBe(9);
  });

  it("handles unclosed attendance logs gracefully without crashing", () => {
    const logs = [
      { clock_in: "2026-07-23T10:00:00Z", clock_out: null },
    ];
    const total = calculateTotalTutoringHours(2, logs);
    expect(total).toBe(2);
  });
});
