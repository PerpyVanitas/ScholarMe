import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "../route";
import { NextRequest } from "next/server";

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        getUser: mockGetUser,
      },
      from: mockFrom,
    })
  ),
}));

describe("Compliance Flags Route /api/v1/finance/flags", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const req = new NextRequest("http://localhost/api/v1/finance/flags");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("GET returns 200 with flags array when authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "auditor-1" } } });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [{ id: "flag-1", flag_level: "yellow" }], error: null }),
    });

    const req = new NextRequest("http://localhost/api/v1/finance/flags");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.flags.length).toBe(1);
  });

  it("POST returns 400 on invalid flag payload", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "auditor-1" } } });

    const req = new NextRequest("http://localhost/api/v1/finance/flags", {
      method: "POST",
      body: JSON.stringify({
        officer_id: "not-a-uuid",
        flag_level: "invalid-color",
        reason: "",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("POST returns 201 when valid compliance flag is issued", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "auditor-1" } } });
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: "flag-1", flag_level: "yellow" }, error: null }),
    });

    const req = new NextRequest("http://localhost/api/v1/finance/flags", {
      method: "POST",
      body: JSON.stringify({
        officer_id: "123e4567-e89b-12d3-a456-426614174000",
        flag_level: "yellow",
        reason: "Late submission of liquidation report",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
  });
});
