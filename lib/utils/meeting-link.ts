/**
 * Utility for generating secure virtual meeting room links for booked tutoring sessions.
 * Generates unique Jitsi Meet or Google Meet room URLs based on session ID and subject.
 */

export function generateVirtualMeetingRoom(sessionId: string, subject: string): {
  meetingUrl: string;
  roomName: string;
  provider: "jitsi" | "google";
} {
  const cleanSubject = subject.toLowerCase().replace(/[^a-z0-9]/g, "");
  const shortId = sessionId.slice(0, 8);
  const roomName = `ScholarMe-${cleanSubject}-${shortId}`;
  const meetingUrl = `https://meet.jit.si/${encodeURIComponent(roomName)}`;

  return {
    meetingUrl,
    roomName,
    provider: "jitsi",
  };
}
