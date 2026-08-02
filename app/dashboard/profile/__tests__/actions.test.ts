import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateProfile, updateTutorInfo } from "../actions";

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        getUser: mockGetUser,
      },
      from: mockFrom,
    })
  ),
}));

vi.mock("@/features/profiles/api/db", () => ({
  birthdateFields: vi.fn().mockReturnValue({ birthdate: null, date_of_birth: null }),
  ensureProfileRow: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("@/features/tutors/api/db", () => ({
  ensureTutorRow: vi.fn().mockResolvedValue({ ok: true, tutor: { id: "tutor-1" } }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Profile Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updateProfile returns error when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "No session" } });

    const result = await updateProfile({
      first_name: "John",
      last_name: "Doe",
      phone_number: null,
      birthdate: null,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Not authenticated");
  });

  it("updateProfile updates profile row successfully when authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: "user-1", first_name: "John", last_name: "Doe" }, error: null }),
      single: vi.fn().mockResolvedValue({ data: { id: "user-1", first_name: "John", last_name: "Doe" }, error: null }),
    });

    const result = await updateProfile({
      first_name: "John",
      last_name: "Doe",
      phone_number: "09123456789",
      birthdate: "2000-01-01",
    });

    expect(result.success).toBe(true);
  });

  it("updateTutorInfo returns error when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "No session" } });

    const result = await updateTutorInfo({
      bio: "Tutor bio",
      hourly_rate: 100,
      years_experience: 2,
      specialization_ids: [],
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Not authenticated");
  });

  it("updateTutorInfo updates tutor row and specializations successfully", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const result = await updateTutorInfo({
      bio: "Experienced Math & CS Tutor",
      hourly_rate: 250,
      years_experience: 3,
      specialization_ids: ["spec-1"],
    });

    expect(result.success).toBe(true);
  });
});
