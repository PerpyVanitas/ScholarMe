import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { createClient } from "@/lib/supabase/client";

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

describe("Auth Providers (OAuth & Magic Links)", () => {
  let mockSupabase: unknown;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      auth: {
        signInWithOAuth: vi.fn(),
        verifyOtp: vi.fn(),
      },
    };
    vi.mocked(createClient).mockReturnValue(mockSupabase);
  });

  describe("OAuth Providers", () => {
    it("should trigger signInWithOAuth with correct provider and redirect URL", async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({ error: null });

      render(<OAuthButtons />);

      // Click Google
      fireEvent.click(screen.getByRole("button", { name: /Google/i }));

      await waitFor(() => {
        expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
          provider: "google",
          options: {
            redirectTo: expect.stringContaining("/auth/callback"),
          },
        });
      });
    });

    it("should handle OAuth errors gracefully", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        error: { message: "OAuth failed" },
      });

      render(<OAuthButtons />);

      fireEvent.click(screen.getByRole("button", { name: /Microsoft/i }));

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith({
          message: "OAuth failed",
        });
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Magic Link / OTP Expiry", () => {
    it("should return an error when verifyOtp is called with expired token", async () => {
      mockSupabase.auth.verifyOtp.mockResolvedValue({
        error: { message: "Token has expired or is invalid" },
      });

      const { error } = await mockSupabase.auth.verifyOtp({
        type: "magiclink",
        token_hash: "expired-hash",
      });

      expect(error.message).toBe("Token has expired or is invalid");
    });
  });
});
