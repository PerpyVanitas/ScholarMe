import { describe, it, expect } from "vitest";
import { formatMeetingMinutesMarkdown } from "../minutes-formatter";

describe("formatMeetingMinutesMarkdown Utility", () => {
  it("formats meeting minutes into structured markdown", () => {
    const data = {
      title: "General Assembly Term Q1",
      date: "2026-08-02",
      presidingOfficer: "Hon. President",
      attendeesCount: 42,
      agendaItems: ["Review Term Budget", "Approve New Tutors"],
      resolutions: ["Passed Budget Allocation ₱50,000"],
    };

    const markdown = formatMeetingMinutesMarkdown(data);
    expect(markdown).toContain("# General Assembly Term Q1");
    expect(markdown).toContain("Official Attendance**: 42 Members Present");
    expect(markdown).toContain("1. Review Term Budget");
    expect(markdown).toContain("Resolution #1**: Passed Budget Allocation ₱50,000");
  });
});
