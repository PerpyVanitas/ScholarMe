import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";

describe("Wiki Search API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if user is not authenticated", async () => {
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error("Unauthorized") }),
      },
    });

    const req = new Request("http://localhost:3000/api/wiki/search", {
      method: "POST",
      body: JSON.stringify({ query: "SOP" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 if query is empty or invalid", async () => {
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
      },
    });

    const req = new Request("http://localhost:3000/api/wiki/search", {
      method: "POST",
      body: JSON.stringify({ query: "" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns matching docs and citations for valid search query", async () => {
    const mockDocs = [
      { id: "1", title: "PLC Operating Procedure", category: "SOP", content: "Tutors must clock in at PLC desk", access_role: "learner" },
      { id: "2", title: "Lead Tutor Guidelines", category: "Tutor Manual", content: "Lead tutors review junior tutors", access_role: "tutor" },
    ];

    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { roles: { name: "learner" } } }),
        order: vi.fn().mockResolvedValue({ data: mockDocs, error: null }),
      }),
    });

    const req = new Request("http://localhost:3000/api/wiki/search", {
      method: "POST",
      body: JSON.stringify({ query: "clock in" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.citations).toHaveLength(2);
    expect(json.citations[0].title).toBe("PLC Operating Procedure");
  });
});
