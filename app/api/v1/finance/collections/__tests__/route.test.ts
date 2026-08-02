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

describe("Revenue Collections Route /api/v1/finance/collections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const req = new NextRequest("http://localhost/api/v1/finance/collections");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("GET returns 200 with collections list when authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "treasurer-1" } } });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [{ id: "col-1", amount: 1500 }], error: null }),
    });

    const req = new NextRequest("http://localhost/api/v1/finance/collections");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.collections.length).toBe(1);
  });

  it("POST returns 400 when body fails Zod schema", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "treasurer-1" } } });

    const req = new NextRequest("http://localhost/api/v1/finance/collections", {
      method: "POST",
      body: JSON.stringify({
        source: "T-Shirt Sales",
        amount: -50,
        officer_2_id: "not-a-uuid",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("POST returns 201 when dual-officer collection is logged successfully", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "123e4567-e89b-12d3-a456-426614174000" } } });
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: "col-1", amount: 1500 }, error: null }),
    });

    const req = new NextRequest("http://localhost/api/v1/finance/collections", {
      method: "POST",
      body: JSON.stringify({
        source: "Merchandise T-Shirt Sales",
        amount: 1500,
        officer_2_id: "223e4567-e89b-12d3-a456-426614174000",
        deposit_reference: "DEP-2026-08-01",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
  });
});
