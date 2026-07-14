import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPettyCash } from "../actions/finance-actions";

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  rpc: vi.fn(),
  from: vi.fn(),
  storage: {
    from: vi.fn(),
  },
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => mockSupabase),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Finance Actions - Petty Cash", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("P2-1: flags petty cash if >$300 requested within 24 hours (anti-splitting)", async () => {
    // Mock user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
    });

    // Mock role check (checkCanSubmitFinance returns true)
    mockSupabase.rpc.mockResolvedValue({ data: true });

    // Mock recent requests to simulate >$300 total
    const selectChain = {
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockResolvedValue({
        data: [{ amount: 200 }, { amount: 50 }],
      }),
    };

    const insertMock = vi.fn().mockResolvedValue({ error: null });

    mockSupabase.from.mockImplementation((table) => {
      if (table === "finance_petty_cash") {
        return {
          select: vi.fn(() => selectChain),
          insert: insertMock,
        };
      }
      return {};
    });

    const formData = new FormData();
    formData.append("amount", "100"); // 200 + 50 + 100 = 350 > 300
    formData.append("justification", "Buy supplies");
    formData.append("action_type", "pending");

    await createPettyCash(formData);

    expect(insertMock).toHaveBeenCalled();
    const insertedData = insertMock.mock.calls[0][0];

    // Expect justification to be flagged
    expect(insertedData.justification).toContain("[FLAGGED: >300 within 24h]");
    expect(insertedData.justification).toContain("Buy supplies");
  });
});
