import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";
import { NextRequest } from "next/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";

describe("Support Ticket Escalation API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is unauthenticated", async () => {
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    });

    const req = new NextRequest("http://localhost:3000/api/v1/admin/support/t123/escalate", {
      method: "POST",
      body: JSON.stringify({ reason: "Complex technical issue" }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: "t123" }) });
    expect(res.status).toBe(401);
  });

  it("returns 400 when escalation reason is invalid", async () => {
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "admin1" } } }) },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { roles: { name: "administrator" } } }),
          }),
        }),
      }),
    });

    const req = new NextRequest("http://localhost:3000/api/v1/admin/support/t123/escalate", {
      method: "POST",
      body: JSON.stringify({ reason: "bad" }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: "t123" }) });
    expect(res.status).toBe(400);
  });
});
