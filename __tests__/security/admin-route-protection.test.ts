import { describe, it, expect, vi, beforeEach } from "vitest";
import AdminLayout from "@/app/dashboard/admin/layout";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { canAccessAdminRoute, getRoleName } from "@/lib/utils/roles";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn().mockImplementation((url) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

vi.mock("@/lib/utils/roles", () => ({
  getRoleName: vi.fn(),
  canAccessAdminRoute: vi.fn(),
}));

describe("P1-7: Admin Route Protection", () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { roles: { name: "learner" } },
        }),
      })),
    };
    (createClient as any).mockResolvedValue(mockSupabase);
    (headers as any).mockResolvedValue({ get: vi.fn().mockReturnValue("/dashboard/admin") });
  });

  it("redirects unauthenticated users to /auth/login", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
    await expect(AdminLayout({ children: "Test" })).rejects.toThrowError("NEXT_REDIRECT:/auth/login");
    expect(redirect).toHaveBeenCalledWith("/auth/login");
  });

  it("redirects non-admin users to /dashboard/home", async () => {
    (getRoleName as any).mockReturnValue("learner");
    (canAccessAdminRoute as any).mockReturnValue(false);

    await expect(AdminLayout({ children: "Test" })).rejects.toThrowError("NEXT_REDIRECT:/dashboard/home");
    expect(redirect).toHaveBeenCalledWith("/dashboard/home");
  });

  it("allows access for authorized admin roles", async () => {
    (getRoleName as any).mockReturnValue("administrator");
    (canAccessAdminRoute as any).mockReturnValue(true);

    const result = await AdminLayout({ children: "Test" });
    expect(redirect).not.toHaveBeenCalled();
    expect(result).toBeDefined();
  });
});
