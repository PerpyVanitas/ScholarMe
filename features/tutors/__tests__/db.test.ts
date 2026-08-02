import { describe, it, expect, vi } from "vitest";
import { ensureTutorRow, fetchTutors } from "../api/db";
import type { SupabaseClient, User } from "@supabase/supabase-js";

vi.mock("@/features/profiles/api/db", () => ({
  ensureProfileRow: vi.fn().mockResolvedValue({ ok: true }),
}));

describe("Tutors DB API Helpers", () => {
  it("ensureTutorRow returns existing tutor row if present", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: "tutor-1", user_id: "u1" } }),
      }),
    } as unknown as SupabaseClient;

    const user = { id: "u1" } as User;
    const res = await ensureTutorRow(mockSupabase, user);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.tutor.id).toBe("tutor-1");
    }
  });

  it("ensureTutorRow inserts new tutor row if none exists", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        insert: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: "tutor-2", user_id: "u2" } }),
      }),
    } as unknown as SupabaseClient;

    const user = { id: "u2" } as User;
    const res = await ensureTutorRow(mockSupabase, user);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.tutor.id).toBe("tutor-2");
    }
  });

  it("fetchTutors builds query with pagination and filters", async () => {
    const mockRange = vi.fn().mockResolvedValue({ data: [{ id: "t1" }], count: 1, error: null });
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      range: mockRange,
    };

    const mockSupabase = {
      from: vi.fn().mockReturnValue(mockQuery),
    } as unknown as SupabaseClient;

    const res = await fetchTutors(mockSupabase, { page: 1, limit: 10, searchQuery: "Alex", specialization: "Math" });
    expect(res.count).toBe(1);
    expect(res.data.length).toBe(1);
  });
});
