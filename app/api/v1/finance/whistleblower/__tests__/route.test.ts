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

describe("Whistleblower Route /api/v1/finance/whistleblower", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const req = new NextRequest("http://localhost/api/v1/finance/whistleblower");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("GET returns 200 with reports when authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [{ id: "report-1", title: "Test" }], error: null }),
    });

    const req = new NextRequest("http://localhost/api/v1/finance/whistleblower");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.reports.length).toBe(1);
  });

  it("POST returns 400 on short description", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } });

    const req = new NextRequest("http://localhost/api/v1/finance/whistleblower", {
      method: "POST",
      body: JSON.stringify({
        title: "Test Report",
        description: "short",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("POST returns 201 when valid anonymous report is submitted", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: "report-1", title: "Financial Irregularity" }, error: null }),
    });

    const req = new NextRequest("http://localhost/api/v1/finance/whistleblower", {
      method: "POST",
      body: JSON.stringify({
        title: "Financial Irregularity Report",
        description: "Observed improper receipt handling during the annual seminar",
        is_anonymous: true,
        target_office: "auditor",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
  });
});
