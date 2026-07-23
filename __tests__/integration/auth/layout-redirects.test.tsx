import { describe, it, expect, vi, beforeEach } from "vitest";
import DashboardLayout from "@/app/dashboard/layout";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn().mockImplementation((url) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/app/dashboard/client-layout", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/components/auth/idle-timeout", () => ({
  IdleTimeoutProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

describe("Layout Redirects (Authentication)", () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null }),
      })),
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabase);
    (vi.mocked(cookies) as any).mockResolvedValue({ get: vi.fn() });
  });

  it("should redirect to /auth/login if unauthenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

    await expect(DashboardLayout({ children: "Test" })).rejects.toThrowError(
      "NEXT_REDIRECT:/auth/login",
    );
    expect(redirect).toHaveBeenCalledWith("/auth/login");
  });

  it("should redirect to /auth/setup-profile if onboarding incomplete", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
    });
    mockSupabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { profile_completed: false } }),
    }));

    await expect(DashboardLayout({ children: "Test" })).rejects.toThrowError(
      "NEXT_REDIRECT:/auth/setup-profile",
    );
    expect(redirect).toHaveBeenCalledWith("/auth/setup-profile");
  });

  it("should render children if authenticated and onboarded", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
    });
    mockSupabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { profile_completed: true } }),
    }));

    const result = await DashboardLayout({ children: "Test" });

    // Assuming it doesn't redirect and returns a React element
    expect(redirect).not.toHaveBeenCalled();
    expect(result).toBeDefined();
  });
});
