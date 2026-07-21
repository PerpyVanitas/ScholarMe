import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import GroupsPage from "@/app/dashboard/network/groups/page";
import { useUser } from "@/lib/user-context";

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: vi.fn((table) => {
      if (table === "study_groups") {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [
              {
                id: "1",
                name: "Biology 101",
                description: "Study group for Bio",
                created_by: "user123",
                study_group_members: [{ count: 1 }],
              },
              {
                id: "2",
                name: "Calculus II",
                description: "Math study group",
                created_by: "user456",
                study_group_members: [{ count: 1 }],
              },
            ],
            error: null,
          }),
          insert: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: "3",
              name: "New Group",
              description: "New Desc",
              created_by: "user123",
            },
            error: null,
          }),
        };
      }
      if (table === "study_group_members") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: [{ group_id: "1" }], error: null }),
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      return {
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user123", email: "test@example.com" } },
        error: null,
      }),
    },
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
  }),
}));

vi.mock("@/lib/user-context", () => ({
  useUser: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/dashboard/network/groups",
  useSearchParams: () => new URLSearchParams(),
}));

describe("Study Groups (Network/Groups)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useUser).mockReturnValue({
      profile: { id: "user123", full_name: "Test User" },
      loading: false,
    });
  });

  it("renders a list of available study groups", async () => {
    render(<GroupsPage />);

    await waitFor(() => {
      expect(screen.getByText("Biology 101")).toBeInTheDocument();
      expect(screen.getByText("Calculus II")).toBeInTheDocument();
    });
  });
});
