import { describe, it, expect, vi, beforeEach } from "vitest";
import { createStudyGroup } from "../api/actions";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

describe("createStudyGroup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when user is not authenticated", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    });

    await expect(
      createStudyGroup({ name: "Calculus Study Group" }),
    ).rejects.toThrow("Unauthorized");
  });

  it("creates a public group and adds creator as owner", async () => {
    const membersInsert = vi.fn().mockResolvedValue({ error: null });
    const groupsInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: "group-1" },
          error: null,
        }),
      }),
    });

    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "study_groups") {
          return { insert: groupsInsert };
        }
        if (table === "study_group_members") {
          return { insert: membersInsert };
        }
        return {};
      }),
    });

    const groupId = await createStudyGroup({
      name: "  Physics Group  ",
      description: "  Weekly problem sets  ",
      is_public: false,
    });

    expect(groupId).toBe("group-1");
    expect(groupsInsert).toHaveBeenCalledWith({
      name: "Physics Group",
      description: "Weekly problem sets",
      is_public: false,
      created_by: "user-1",
    });
    expect(membersInsert).toHaveBeenCalledWith({
      group_id: "group-1",
      user_id: "user-1",
      role: "owner",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/groups");
  });

  it("throws when group insert fails", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from: vi.fn(() => ({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "duplicate group name" },
            }),
          }),
        }),
      })),
    });

    await expect(createStudyGroup({ name: "Duplicate" })).rejects.toThrow(
      "duplicate group name",
    );
  });
});
