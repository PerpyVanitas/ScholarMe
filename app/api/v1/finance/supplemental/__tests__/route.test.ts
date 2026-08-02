import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";
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

describe("POST /api/v1/finance/supplemental", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const req = new NextRequest("http://localhost/api/v1/finance/supplemental", {
      method: "POST",
      body: JSON.stringify({
        parent_request_id: "123e4567-e89b-12d3-a456-426614174000",
        variance_amount: 500,
        justification: "Additional materials needed",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when body fails Zod schema validation", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } });

    const req = new NextRequest("http://localhost/api/v1/finance/supplemental", {
      method: "POST",
      body: JSON.stringify({
        parent_request_id: "invalid-uuid",
        variance_amount: -50,
        justification: "short",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 404 when parent request is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
    });

    const req = new NextRequest("http://localhost/api/v1/finance/supplemental", {
      method: "POST",
      body: JSON.stringify({
        parent_request_id: "123e4567-e89b-12d3-a456-426614174000",
        variance_amount: 500,
        justification: "Additional materials needed",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it("returns 201 when supplemental request is created successfully", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } });

    // Chain 1: parent request lookup
    const mockParentQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: "123e4567-e89b-12d3-a456-426614174000", amount: 2000 }, error: null }),
    };

    // Chain 2: supplemental insert
    const mockInsertQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: "supp-1", variance_amount: 500 }, error: null }),
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === "finance_budget_requests") return mockParentQuery;
      if (table === "finance_supplemental_requests") return mockInsertQuery;
      return {};
    });

    const req = new NextRequest("http://localhost/api/v1/finance/supplemental", {
      method: "POST",
      body: JSON.stringify({
        parent_request_id: "123e4567-e89b-12d3-a456-426614174000",
        variance_amount: 500,
        justification: "Additional materials needed",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.requires_supplemental_approval).toBe(true);
  });
});
