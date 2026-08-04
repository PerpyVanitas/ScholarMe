import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "../route";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Mock Supabase
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("Event Attendance API Handler (/api/v1/events/[id]/attendance)", () => {
  const mockEventId = "11111111-1111-1111-1111-111111111111";
  const mockUserId = "22222222-2222-2222-2222-222222222222";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when request is unauthenticated", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    const req = new NextRequest(`http://localhost/api/v1/events/${mockEventId}/attendance`);
    const params = Promise.resolve({ id: mockEventId });
    const res = await GET(req, { params });

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns aggregate count and user attendance on GET", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: mockUserId } } }),
      },
      from: vi.fn((table: string) => {
        if (table === "event_rsvps") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            then: vi.fn().mockImplementation((cb: (res: { count: number; data: null; error: null }) => void) =>
              cb({ count: 12, data: null, error: null })
            ),
          };
        }
        if (table === "event_attendance") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { status: "checked_in", check_in_time: new Date().toISOString() },
              error: null,
            }),
            then: vi.fn().mockImplementation((cb: (res: { count: number; data: null; error: null }) => void) =>
              cb({ count: 4, data: null, error: null })
            ),
          };
        }
        return {};
      }),
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    const req = new NextRequest(`http://localhost/api/v1/events/${mockEventId}/attendance`);
    const params = Promise.resolve({ id: mockEventId });
    const res = await GET(req, { params });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.eventId).toBe(mockEventId);
    expect(json).toHaveProperty("joinedCount");
    expect(json).not.toHaveProperty("participants"); // Privacy check: no participant names
  });

  it("returns 400 when POST payload is invalid", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: mockUserId } } }),
      },
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    const req = new NextRequest(`http://localhost/api/v1/events/${mockEventId}/attendance`, {
      method: "POST",
      body: JSON.stringify({ action: "invalid_action" }),
    });
    const params = Promise.resolve({ id: mockEventId });
    const res = await POST(req, { params });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid payload");
  });

  it("successfully checks in user on POST with action check_in", async () => {
    const mockAttendance = {
      id: "33333333-3333-3333-3333-333333333333",
      event_id: mockEventId,
      profile_id: mockUserId,
      status: "checked_in",
      check_in_time: new Date().toISOString(),
    };

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: mockUserId } } }),
      },
      from: vi.fn((table: string) => {
        if (table === "facility_events") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: mockEventId, title: "Study Jam" }, error: null }),
          };
        }
        if (table === "event_attendance") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            upsert: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockAttendance, error: null }),
          };
        }
        return {};
      }),
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    const req = new NextRequest(`http://localhost/api/v1/events/${mockEventId}/attendance`, {
      method: "POST",
      body: JSON.stringify({ action: "check_in" }),
    });
    const params = Promise.resolve({ id: mockEventId });
    const res = await POST(req, { params });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toBe("Checked in successfully");
    expect(json.attendance.status).toBe("checked_in");
  });
});
