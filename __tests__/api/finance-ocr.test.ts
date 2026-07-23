import { describe, it, expect, vi } from "vitest";
import { POST } from "@/app/api/finance/ocr/route";
import { NextRequest } from "next/server";

// Mock Supabase
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
  })),
}));

describe("Finance OCR API", () => {
  it("should return 401 when unauthorized", async () => {
    const req = new NextRequest("http://localhost:3000/api/finance/ocr", {
      method: "POST",
      body: JSON.stringify({ file_url: "test.pdf" }),
    });
    
    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});
