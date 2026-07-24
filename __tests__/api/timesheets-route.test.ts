import { describe, it, expect, vi } from "vitest";
import { POST } from "@/app/api/v1/timesheets/route";

// Mock Supabase
vi.mock("@/lib/supabase/create-client", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
  })),
}));

describe("Timesheets API", () => {
  it("should return 401 when unauthorized", async () => {
    const req = new Request("http://localhost:3000/api/timesheets", {
      method: "POST",
      body: JSON.stringify({ action: "clock_in" }),
    });
    
    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});
