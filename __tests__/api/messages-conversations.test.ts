import { describe, it, expect, vi } from "vitest";
import { POST } from "@/app/api/messages/conversations/route";

// Mock Supabase
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
  })),
}));

describe("Messages Conversations API", () => {
  it("should return 401 when unauthorized", async () => {
    const req = new Request("http://localhost:3000/api/messages/conversations", {
      method: "POST",
      body: JSON.stringify({ participantId: "123" }),
    });
    
    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});
