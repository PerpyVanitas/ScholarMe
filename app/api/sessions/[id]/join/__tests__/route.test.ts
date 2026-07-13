import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";
import { createClient } from "@/lib/supabase/create-client";
import { NextResponse } from "next/server";

// Mock dependencies
vi.mock("@/lib/supabase/create-client", () => ({
  createClient: vi.fn(),
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn((body, init) => ({ body, status: init?.status || 200 })),
  },
}));

describe("Join Session Logic", () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      auth: {
        getUser: vi
          .fn()
          .mockResolvedValue({ data: { user: { id: "user-1" } } }),
      },
      from: vi.fn(),
    };

    (createClient as any).mockResolvedValue(mockSupabase);
  });

  it("should prevent joining if session is not a group session (max_participants <= 1)", async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "sessions") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              max_participants: 1,
              status: "pending",
              learner_id: "other-user",
            },
          }),
        };
      }
      return { select: vi.fn().mockReturnThis() };
    });

    const result = await POST({} as Request, {
      params: Promise.resolve({ id: "session-1" }),
    });
    expect(result).toEqual({
      body: { error: "This is not a group session" },
      status: 400,
    });
  });

  it("should prevent joining if session is full", async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "sessions") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              max_participants: 5,
              status: "pending",
              learner_id: "other-user",
            },
          }),
        };
      }
      if (table === "session_participants") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          neq: vi.fn().mockResolvedValue({ count: 5 }), // 5 participants currently
        };
      }
      return {};
    });

    const result = await POST({} as Request, {
      params: Promise.resolve({ id: "session-1" }),
    });
    expect(result).toEqual({ body: { error: "Session is full" }, status: 400 });
  });

  it("should allow joining if session has capacity", async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "sessions") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              max_participants: 5,
              status: "pending",
              learner_id: "other-user",
            },
            error: null,
          }),
        };
      }
      if (table === "session_participants") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          neq: vi.fn().mockResolvedValue({ count: 3 }), // 3 participants, so 2 open spots
          maybeSingle: vi.fn().mockResolvedValue({ data: null }), // User not already registered
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      return {};
    });

    const result = await POST({} as Request, {
      params: Promise.resolve({ id: "session-1" }),
    });
    expect(result).toEqual({ body: { success: true }, status: 200 });
  });
});
