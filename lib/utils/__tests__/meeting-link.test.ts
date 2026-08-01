import { describe, it, expect } from "vitest";
import { generateVirtualMeetingRoom } from "../meeting-link";

describe("generateVirtualMeetingRoom Utility", () => {
  it("generates a valid Jitsi meeting URL with sanitized room name", () => {
    const session = generateVirtualMeetingRoom("12345678-abcd-efgh", "Computer Science 101");
    expect(session.meetingUrl).toContain("https://meet.jit.si/ScholarMe-computerscience101-12345678");
    expect(session.roomName).toBe("ScholarMe-computerscience101-12345678");
    expect(session.provider).toBe("jitsi");
  });

  it("handles subjects with special characters cleanly", () => {
    const session = generateVirtualMeetingRoom("98765432-1111-2222", "Organic Chemistry #2!");
    expect(session.roomName).toBe("ScholarMe-organicchemistry2-98765432");
  });
});
