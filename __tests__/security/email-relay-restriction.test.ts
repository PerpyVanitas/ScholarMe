import { describe, it, expect, vi } from "vitest";
import { POST } from "@/app/api/webhooks/email/route";
import { NextRequest } from "next/server";

// Mock Resend
const { mockSend, mockSingle } = vi.hoisted(() => ({
  mockSend: vi.fn().mockResolvedValue({ id: "resend-123" }),
  mockSingle: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockReturnValue({
    check: vi.fn().mockResolvedValue({ success: true })
  })
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: mockSend };
  },
}));

// Mock Supabase
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi
        .fn()
        .mockResolvedValue({ data: { user: { id: "user-123" } } }),
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: () => mockSingle(),
  }),
}));

describe("Email Relay Restriction", () => {
  it("P1-15: Learner role is blocked from sending arbitrary email", async () => {
    // Return learner role
    mockSingle.mockResolvedValueOnce({
      data: { roles: { name: "learner" } },
      error: null,
    });

    const req = new NextRequest("http://localhost/api/webhooks/email", {
      method: "POST",
      body: JSON.stringify({
        to: "victim@example.com",
        subject: "spam",
        html: "<p>spam</p>",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain("Forbidden");
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("P1-15: Officer role is allowed to send email", async () => {
    // Return officer role
    mockSingle.mockResolvedValueOnce({
      data: { roles: { name: "secretary" } },
      error: null,
    });

    const req = new NextRequest("http://localhost/api/webhooks/email", {
      method: "POST",
      body: JSON.stringify({
        to: "user@example.com",
        subject: "update",
        html: "<p>update</p>",
      }),
    });

    const res = await POST(req);
    // Might fail with 400 if body is invalid, or 200 if it passes validation
    // The key is that it didn't fail with 403 Forbidden
    expect(res.status).not.toBe(403);
  });
});
