import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/auth/card-login/route";
import { NextRequest } from "next/server";

let callCount = 0;

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: () => ({
    check: vi.fn(async () => {
      callCount++;
      if (callCount >= 6) {
        return { success: false, remaining: 0, reset: Date.now() + 10000 };
      }
      return {
        success: true,
        remaining: 5 - callCount,
        reset: Date.now() + 10000,
      };
    }),
  }),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi
      .fn()
      .mockResolvedValue({
        data: {
          pin: "$2a$10$invalidhash",
          profiles: { roles: { name: "learner" } },
        },
      }),
    auth: {
      admin: {
        getUserById: vi
          .fn()
          .mockResolvedValue({ data: { user: { email: "test@example.com" } } }),
        generateLink: vi
          .fn()
          .mockResolvedValue({
            data: { properties: { hashed_token: "mock" } },
          }),
      },
    },
  }),
}));

vi.mock("@/lib/supabase/create-client", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      verifyOtp: vi.fn().mockResolvedValue({ data: { user: { id: "1" } } }),
    },
  }),
}));

describe("Card Login Rate Limit", () => {
  beforeEach(() => {
    callCount = 0;
  });

  it("P1-1: 6th rapid failed attempt on same cardId returns 429", async () => {
    const payload = { cardId: "test-card-limit", pin: "0000" };

    // First 5 attempts should not be 429 (they might be 401 if mocked DB fails, but not 429)
    for (let i = 0; i < 5; i++) {
      const req = new NextRequest("http://localhost/api/auth/card-login", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const res = await POST(req);
      expect(res.status).not.toBe(429);
    }

    // 6th attempt should be blocked by rate limit
    const req6 = new NextRequest("http://localhost/api/auth/card-login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const res6 = await POST(req6);
    expect(res6.status).toBe(429);

    const json = await res6.json();
    expect(json.error.details).toBe(
      "Too many attempts. Please try again later.",
    );
  });
});
