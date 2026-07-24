import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../../app/api/v1/auth/card-login/route";

// Mock rate limiter
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: () => ({
    check: vi.fn().mockImplementation((id: string) => {
      if (id === "rate-limited-card") {
        return Promise.resolve({ success: false });
      }
      return Promise.resolve({ success: true });
    }),
  }),
}));

// Mock Supabase client
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi
      .fn()
      .mockResolvedValue({
        data: { pin: "1234", user_id: "user-123" },
        error: null,
      }),
    auth: {
      admin: {
        getUserById: vi
          .fn()
          .mockResolvedValue({
            data: { user: { email: "test@example.com" } },
            error: null,
          }),
        generateLink: vi
          .fn()
          .mockResolvedValue({
            data: { properties: { hashed_token: "mock-token" } },
            error: null,
          }),
      },
    },
  })),
}));

describe("Card Login Rate Limiting (P1-1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 429 when rate limit is exceeded", async () => {
    const request = new Request("http://localhost/api/auth/card-login", {
      method: "POST",
      body: JSON.stringify({ cardId: "rate-limited-card", pin: "1234" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(429);

    const data = await response.json();
    expect(data.error.code).toBe("SYSTEM-001");
  });

  it("should not return 429 when rate limit is not exceeded", async () => {
    const request = new Request("http://localhost/api/auth/card-login", {
      method: "POST",
      body: JSON.stringify({ cardId: "valid-card", pin: "1234" }),
    });

    const response = await POST(request);
    // Since we mock the DB but not the actual DB call, it should return 401/400 but NOT 429
    expect(response.status).not.toBe(429);
  });
});
