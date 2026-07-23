import { describe, it, expect, vi } from "vitest";
import { POST } from "@/app/api/gamification/daily/route";

// Mock Supabase
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
  })),
}));

describe("Gamification Daily API", () => {
  it("should return 401 when unauthorized", async () => {
    const req = new Request("http://localhost:3000/api/gamification/daily", {
      method: "POST"
    });
    
    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});
