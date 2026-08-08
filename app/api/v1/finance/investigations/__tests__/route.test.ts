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

describe("Investigations Route /api/v1/finance/investigations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const req = new NextRequest("http://localhost/api/v1/finance/investigations");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("GET returns 200 with cases list when authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "investigator-1" } } });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [{ id: "case-1", status: "ongoing" }], error: null }),
    });

    const req = new NextRequest("http://localhost/api/v1/finance/investigations");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.cases.length).toBe(1);
  });

  it("POST returns 400 when body fails Zod schema", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "investigator-1" } } });

    const req = new NextRequest("http://localhost/api/v1/finance/investigations", {
      method: "POST",
      body: JSON.stringify({
        flag_id: "invalid-uuid",
        meeting_notes: "short",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("POST returns 201 when investigation case is created successfully for a valid flag window", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "investigator-1" } } });
    mockFrom.mockImplementation((table: string) => {
      if (table === "finance_compliance_flags") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { created_at: new Date().toISOString() },
            error: null,
          }),
        };
      }
      return {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: "case-1", status: "ongoing" }, error: null }),
      };
    });

    const req = new NextRequest("http://localhost/api/v1/finance/investigations", {
      method: "POST",
      body: JSON.stringify({
        flag_id: "123e4567-e89b-12d3-a456-426614174000",
        meeting_notes: "Initial hearing conducted with officer and finance committee representatives.",
        status: "ongoing",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it("POST returns 400 when appeal is filed past 3-day deadline", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "investigator-1" } } });
    const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
    mockFrom.mockImplementation((table: string) => {
      if (table === "finance_compliance_flags") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { created_at: fourDaysAgo },
            error: null,
          }),
        };
      }
      return {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: "case-1", status: "ongoing" }, error: null }),
      };
    });

    const req = new NextRequest("http://localhost/api/v1/finance/investigations", {
      method: "POST",
      body: JSON.stringify({
        flag_id: "123e4567-e89b-12d3-a456-426614174000",
        meeting_notes: "Late appeal attempt",
        status: "ongoing",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Appeal window expired");
  });
});
