import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateBudgetRequestStatus } from "../actions/finance-actions";

const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  rpc: vi.fn(),
  from: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => mockSupabase),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Finance Actions - Budget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("P2-2: prevents skipping president_approved for budgets > $5000", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
    });

    // Mock role check (checkCanReviewFinance / checkCanApproveFinance)
    // We'll mock rpc to return true so permissions aren't the blocker, only the state machine.
    mockSupabase.rpc.mockResolvedValue({ data: true });

    // Mock existing budget
    const updateMock = vi.fn().mockResolvedValue({ error: null });
    const selectChain = {
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          status: "finance_review",
          amount: 5001,
          activity_title: "Big Event",
          profiles: { email: "test@example.com" },
        },
      }),
    };

    mockSupabase.from.mockImplementation((table) => {
      if (table === "finance_budget_requests") {
        return {
          select: vi.fn(() => selectChain),
          update: vi.fn(() => ({ eq: updateMock })),
        };
      }
      return {};
    });

    // Attempting to go from finance_review to released directly for >$5000 should fail
    await expect(
      updateBudgetRequestStatus("req-123", "released"),
    ).rejects.toThrow("Unauthorized finance status transition");

    expect(updateMock).not.toHaveBeenCalled();
  });

  it("P2-2: allows finance_review to released directly for budgets <= $5000", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
    });

    mockSupabase.rpc.mockResolvedValue({ data: true });

    const updateMock = vi.fn().mockResolvedValue({ error: null });
    const selectChain = {
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          status: "finance_review",
          amount: 5000,
          activity_title: "Small Event",
          profiles: { email: "test@example.com" },
        },
      }),
    };

    mockSupabase.from.mockImplementation((table) => {
      if (table === "finance_budget_requests") {
        return {
          select: vi.fn(() => selectChain),
          update: vi.fn(() => ({ eq: updateMock })),
        };
      }
      return {};
    });

    // Should succeed
    await expect(
      updateBudgetRequestStatus("req-123", "released"),
    ).resolves.not.toThrow();

    expect(updateMock).toHaveBeenCalledWith("id", "req-123");
  });
});
