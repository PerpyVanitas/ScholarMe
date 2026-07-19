import { describe, it, expect, vi, beforeEach } from "vitest";
import { loginWithEmail, signOut } from "../actions";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// Mock dependencies
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

// Mock the database queries
vi.mock("@/features/profiles/api/db", () => ({
  resolveRoleId: vi.fn().mockResolvedValue("mocked-role-id"),
  birthdateFields: vi.fn().mockReturnValue({}),
}));

vi.mock("@/lib/utils/login-history", () => ({
  recordLoginHistory: vi.fn(),
}));

describe("Auth Actions", () => {
  let mockSupabase: unknown;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      auth: {
        signInWithPassword: vi.fn(),
        signOut: vi.fn(),
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        admin: {
          createUser: vi.fn(),
        },
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
        update: vi.fn().mockReturnThis(),
      })),
    };

    (createClient as any).mockResolvedValue(mockSupabase);
  });

  describe("loginWithEmail", () => {
    it("should return success when credentials are correct", async () => {
      // @ts-ignore: Strict unknown type check
      (mockSupabase as any).auth.signInWithPassword.mockResolvedValue({ data: { user: { id: "1" } }, error: null });

      const formData = new FormData();
      formData.append("email", "test@example.com");
      formData.append("password", "password123");

      const result = await loginWithEmail(formData);

      // @ts-ignore: Strict unknown type check
      expect((mockSupabase as any).auth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
      expect(result).toEqual({ success: true });
    });

    it("should lowercase the email automatically (P3-3)", async () => {
      // @ts-ignore
      (mockSupabase as any).auth.signInWithPassword.mockResolvedValue({ data: { user: { id: "1" } }, error: null });

      const formData = new FormData();
      formData.append("email", "USER@eXaMpLe.com");
      formData.append("password", "password123");

      await loginWithEmail(formData);

      // @ts-ignore
      expect((mockSupabase as any).auth.signInWithPassword).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "password123",
      });
    });

    it("should return error when credentials are wrong", async () => {
      // @ts-ignore: Strict unknown type check
      (mockSupabase as any).auth.signInWithPassword.mockResolvedValue({
        error: { message: "Invalid credentials" },
      });

      const formData = new FormData();
      formData.append("email", "test@example.com");
      formData.append("password", "wrongpass");

      const result = await loginWithEmail(formData);

      expect(result).toEqual({ error: "Invalid login credentials" });
    });
  });

  describe("signOut", () => {
    it("should sign out and redirect to home", async () => {
      await signOut();

      // @ts-ignore: Strict unknown type check
      expect((mockSupabase as any).auth.signOut).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith("/");
    });

    it("should clock out the user if they have an open timesheet", async () => {
      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();

      // @ts-ignore: Strict unknown type check
      (mockSupabase as any).auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
      });

      // @ts-ignore: Strict unknown type check
      (mockSupabase as any).from = vi.fn().mockImplementation((table) => {
        if (table === "timesheets") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn((field, val) => {
              if (field === "user_id" && val === "user-123")
                return {
                  is: vi.fn().mockReturnThis(),
                  maybeSingle: vi
                    .fn()
                    .mockResolvedValue({ data: { id: "ts-1" } }),
                };
              return {
                is: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: null }),
              };
            }),
            update: mockUpdate,
            is: vi.fn().mockReturnThis(),
          };
        }
      });

      mockUpdate.mockReturnValue({ eq: mockEq });

      await signOut();

      expect(mockUpdate).toHaveBeenCalledWith({
        clock_out: expect.any(String),
      });
      expect(mockEq).toHaveBeenCalledWith("id", "ts-1");
      // @ts-ignore: Strict unknown type check
      expect((mockSupabase as any).auth.signOut).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith("/");
    });
  });
});
