import { describe, it, expect, vi } from "vitest";
import { updateAvatar } from "@/app/dashboard/profile/actions";

// Mock Supabase
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "123" } } }),
    },
    from: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    maybeSingle: vi
      .fn()
      .mockResolvedValue({ data: { id: "123" }, error: null }),
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/features/profiles/api/db", () => ({
  ensureProfileRow: vi.fn().mockResolvedValue({ ok: true }),
}));

describe("Avatar URL Validation", () => {
  it("P1-14: Rejects javascript: protocol URLs", async () => {
    const maliciousUrl = "javascript:alert(1)";
    const result = await updateAvatar(maliciousUrl);
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid avatar URL");
  });

  it("P1-14: Accepts https protocol URLs", async () => {
    const validUrl = "https://example.com/avatar.jpg";
    const result = await updateAvatar(validUrl);
    expect(result.success).toBe(true);
  });
});
