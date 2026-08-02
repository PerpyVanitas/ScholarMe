import { describe, it, expect, vi } from "vitest";
import {
  birthdateFields,
  resolveRoleId,
  roleNameFromUser,
  ensureProfileRow,
} from "../api/db";
import type { SupabaseClient, User } from "@supabase/supabase-js";

describe("Profiles DB Helpers", () => {
  it("birthdateFields formats ISO dates correctly", () => {
    expect(birthdateFields(null)).toEqual({ birthdate: null, date_of_birth: null });
    expect(birthdateFields("2026-08-02T12:00:00Z")).toEqual({
      birthdate: "2026-08-02",
      date_of_birth: "2026-08-02",
    });
    expect(birthdateFields("2026-08-02")).toEqual({
      birthdate: "2026-08-02",
      date_of_birth: "2026-08-02",
    });
  });

  it("roleNameFromUser extracts role correctly from metadata", () => {
    const userWithRole = {
      id: "u1",
      user_metadata: { role_name: "tutor" },
    } as unknown as User;
    expect(roleNameFromUser(userWithRole)).toBe("tutor");

    const userWithFallback = {
      id: "u2",
      user_metadata: { role: "president" },
    } as unknown as User;
    expect(roleNameFromUser(userWithFallback)).toBe("president");

    const userDefault = {
      id: "u3",
      user_metadata: {},
    } as unknown as User;
    expect(roleNameFromUser(userDefault)).toBe("learner");
  });

  it("resolveRoleId fetches role id or falls back to learner", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: "role-tutor" } }),
      }),
    } as unknown as SupabaseClient;

    const roleId = await resolveRoleId(mockSupabase, "tutor");
    expect(roleId).toBe("role-tutor");
  });

  it("ensureProfileRow returns existing role_id when profile exists", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: "u1", role_id: "role-1" } }),
      }),
    } as unknown as SupabaseClient;

    const user = { id: "u1", email: "test@example.com" } as User;
    const res = await ensureProfileRow(mockSupabase, user);
    expect(res).toEqual({ ok: true, role_id: "role-1" });
  });
});
