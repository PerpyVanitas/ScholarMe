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
              },
              {
                id: "2",
                name: "Calculus II",
                description: "Math study group",
                created_by: "user456",
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

describe("Study Groups (Network/Groups)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useUser as any).mockReturnValue({
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
