import { describe, it, expect } from "vitest";
import { generateGoogleCalendarUrl, generateOutlookCalendarUrl } from "../calendar-event";

describe("Calendar Event Utilities", () => {
  const sampleEvent = {
    title: "Math 101 Peer Tutoring",
    description: "Calculus limits & derivatives review session",
    location: "PLC Room 302",
    startTime: "2026-08-10T14:00:00Z",
    durationMinutes: 60,
  };

  it("generates a valid Google Calendar URL", () => {
    const url = generateGoogleCalendarUrl(sampleEvent);
    expect(url).toContain("https://calendar.google.com/calendar/render");
    expect(url).toContain("text=Math+101+Peer+Tutoring");
    expect(url).toContain("location=PLC+Room+302");
  });

  it("generates a valid Outlook Calendar URL", () => {
    const url = generateOutlookCalendarUrl(sampleEvent);
    expect(url).toContain("https://outlook.live.com/calendar/0/deeplink/compose");
    expect(url).toContain("subject=Math+101+Peer+Tutoring");
  });
});
