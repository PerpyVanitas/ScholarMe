import { describe, it, expect } from "vitest";

describe("Event Attendance & XP Calculation System", () => {
  it("calculates XP correctly based on stay duration (base 50 XP + 1 XP/min, max 200)", () => {
    function calculateEventXp(durationMinutes: number): number {
      return Math.min(200, 50 + Math.min(150, Math.max(0, durationMinutes)));
    }

    expect(calculateEventXp(0)).toBe(50); // 50 base XP
    expect(calculateEventXp(10)).toBe(60); // 50 + 10 = 60 XP
    expect(calculateEventXp(60)).toBe(110); // 50 + 60 = 110 XP
    expect(calculateEventXp(120)).toBe(170); // 50 + 120 = 170 XP
    expect(calculateEventXp(180)).toBe(200); // 50 + 150 (max cap) = 200 XP
    expect(calculateEventXp(300)).toBe(200); // capped at 200 XP
  });

  it("calculates attendance stay duration in minutes accurately", () => {
    function calculateDuration(checkInIso: string, checkOutIso: string): number {
      const checkIn = new Date(checkInIso);
      const checkOut = new Date(checkOutIso);
      return Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / 60000));
    }

    const checkIn = "2026-08-03T10:00:00.000Z";
    const checkOut = "2026-08-03T11:30:00.000Z";

    expect(calculateDuration(checkIn, checkOut)).toBe(90); // 90 minutes
  });

  it("evaluates whether an event is ongoing based on start and end time", () => {
    function isEventOngoing(startTimeIso: string, endTimeIso: string, nowIso: string): boolean {
      const start = new Date(startTimeIso);
      const end = new Date(endTimeIso);
      const now = new Date(nowIso);
      return now >= start && now <= end;
    }

    const start = "2026-08-03T14:00:00.000Z";
    const end = "2026-08-03T16:00:00.000Z";

    expect(isEventOngoing(start, end, "2026-08-03T13:59:00.000Z")).toBe(false); // upcoming
    expect(isEventOngoing(start, end, "2026-08-03T14:00:00.000Z")).toBe(true);  // ongoing
    expect(isEventOngoing(start, end, "2026-08-03T15:30:00.000Z")).toBe(true);  // ongoing
    expect(isEventOngoing(start, end, "2026-08-03T16:01:00.000Z")).toBe(false); // past
  });
});
