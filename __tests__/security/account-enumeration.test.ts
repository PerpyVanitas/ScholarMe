import { describe, it, expect, vi } from "vitest";
import { signUp, loginWithEmail } from "@/features/auth/actions";

// Mock Supabase
const { mockSignInWithPassword, mockAdminSelect, mockCreateUser } = vi.hoisted(
  () => ({
    mockSignInWithPassword: vi.fn(),
    mockAdminSelect: vi.fn(),
    mockCreateUser: vi.fn(),
  }),
);

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
  }),
  createAdminClient: vi.fn().mockResolvedValue({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: (...args: unknown[]) => mockAdminSelect(...args),
    auth: {
      admin: {
        createUser: (...args: unknown[]) => mockCreateUser(...args),
      },
    },
  }),
}));

vi.mock("@/features/profiles/api/db", () => ({
  resolveRoleId: vi.fn().mockResolvedValue("role-id"),
  birthdateFields: vi.fn().mockReturnValue({}),
}));

describe("Account Enumeration Prevention", () => {
  it("P1-23: Signup with an already-registered email returns a generic error", async () => {
    // We simulate existing email error from createUser
    mockAdminSelect.mockResolvedValueOnce({ data: null }); // Phone number not registered
    mockCreateUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "User already registered" },
    });

    const formData = new FormData();
    formData.append("email", "test@example.com");
    formData.append("password", "password123");
    formData.append("first_name", "Test");
    formData.append("last_name", "User");

    const result = await signUp(formData);
    expect(result.error).toBe(
      "Registration failed. Please check your information and try again.",
    );
  });

  it("P1-23: Signup with an already-registered phone returns a generic error", async () => {
    // Phone already registered
    mockAdminSelect.mockResolvedValueOnce({ data: { id: "existing-user" } });
    mockCreateUser.mockResolvedValueOnce({
      data: null,
      error: { message: "User already registered" },
    });

    const formData = new FormData();
    formData.append("first_name", "Test");
    formData.append("last_name", "User");
    formData.append("phone_number", "+15555555555");
    formData.append("date_of_birth", "1990-01-01");
    formData.append("email", "test2@example.com");

    const result = await signUp(formData);
    expect(result.error).toBe(
      "Registration failed. Please check your information and try again.",
    );
  });

  it("P1-24: Login returns identical error for wrong password or non-existent email", async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      error: { message: "Invalid login credentials" }, // Supabase default
    });

    const formData1 = new FormData();
    formData1.append("email", "wrong@example.com");
    formData1.append("password", "wrong");
    const result1 = await loginWithEmail(formData1);

    mockSignInWithPassword.mockResolvedValueOnce({
      error: { message: "Some other provider error" },
    });

    const formData2 = new FormData();
    formData2.append("email", "correct@example.com");
    formData2.append("password", "wrong");
    const result2 = await loginWithEmail(formData2);

    expect(result1.error).toBe("Invalid login credentials");
    expect(result2.error).toBe("Invalid login credentials");
  });
});
