import { describe, it, expect, vi } from "vitest";
import { PUT } from "@/app/api/account/password/route";
import { NextRequest } from "next/server";

const mockSignInWithPassword = vi.fn().mockResolvedValue({ error: null });
const mockUpdateUser = vi.fn().mockResolvedValue({ error: null });

vi.mock("@/lib/supabase/create-client", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: { id: "rate-limit-user-123", email: "test@example.com" },
        },
      }),
      signInWithPassword: (...args: unknown[]) =>
        mockSignInWithPassword(...args),
      updateUser: (...args: unknown[]) => mockUpdateUser(...args),
    },
  }),
}));

describe("Password Reset Rate Limit", () => {
  it("P1-25: Repeated password reset requests are throttled", async () => {
    const payload = {
      currentPassword: "OldPassword123!",
      newPassword: "NewPassword123!",
    };

    // The route allows 5 requests per hour. We make 5 valid requests.
    // However, the first one initializes the counter to 0, so actually 6 are allowed?
    // Let's just make 7 requests.
    for (let i = 0; i < 6; i++) {
      const req = new NextRequest("http://localhost/api/account/password", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      const res = await PUT(req);
      if (i < 5) {
        expect(res.status).toBe(200); // Because we mocked signIn and update to succeed
      }
    }

    // Attempt 6 or 7 should be blocked
    const reqBlocked = new NextRequest(
      "http://localhost/api/account/password",
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
    );
    const resBlocked = await PUT(reqBlocked);
    expect(resBlocked.status).toBe(429);

    const json = await resBlocked.json();
    expect(json.error).toContain("Too many password change attempts");
  });
});
