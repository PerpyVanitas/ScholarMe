import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  submitLiquidation,
  createBudgetRequest,
} from "../../../features/finance/actions/finance-actions";

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

describe("Integration: Finance - Liquidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
    });
    mockSupabase.rpc.mockResolvedValue({ data: true }); // Role checks pass
  });

  it("P2-11: Late liquidation blocks new requests", async () => {
    const selectChain = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [{ id: "liq-1" }], // Returns a late liquidation
      }),
    };

    mockSupabase.from.mockImplementation((table) => {
      if (table === "finance_liquidations") {
        return {
          select: vi.fn(() => selectChain),
        };
      }
      return {};
    });

    const formData = new FormData();
    formData.append("activity_title", "Test");
    formData.append("amount", "100");

    await expect(createBudgetRequest(formData)).rejects.toThrow(
      "You have late liquidations. Please resolve them before submitting new budget requests.",
    );
  });

  it("P2-13: Stale liquidation state blocks submission on rejected budget", async () => {
    const maybeSingleMock = vi.fn().mockResolvedValue({ data: null }); // Idempotency check passes
    const singleMock = vi.fn().mockResolvedValue({
      data: { created_at: "2024-03-01T00:00:00Z", status: "rejected" },
    }); // Budget is rejected

    const selectChain = {
      eq: vi.fn().mockReturnThis(),
      maybeSingle: maybeSingleMock,
      single: singleMock,
    };

    mockSupabase.from.mockImplementation((table) => {
      return {
        select: vi.fn(() => selectChain),
      };
    });

    const formData = new FormData();
    formData.append("request_id", "req-1");

    await expect(submitLiquidation(formData)).rejects.toThrow(
      "Cannot liquidate an unreleased or rejected budget",
    );
  });

  it("P2-17: Liquidation submission idempotency", async () => {
    // Existing liquidation exists
    const maybeSingleMock = vi
      .fn()
      .mockResolvedValue({ data: { id: "liq-1" } });

    const selectChain = {
      eq: vi.fn().mockReturnThis(),
      maybeSingle: maybeSingleMock,
    };

    mockSupabase.from.mockImplementation((table) => {
      return {
        select: vi.fn(() => selectChain),
      };
    });

    const formData = new FormData();
    formData.append("request_id", "req-1");

    await expect(submitLiquidation(formData)).rejects.toThrow(
      "Liquidation already submitted for this request",
    );
  });

  it("P2-10: Receipt upload size limit (50MB)", async () => {
    const maybeSingleMock = vi.fn().mockResolvedValue({ data: null }); // Idempotency check passes
    const singleMock = vi.fn().mockResolvedValue({
      data: { created_at: "2024-03-01T00:00:00Z", status: "released" },
    }); // Budget is released

    const selectChain = {
      eq: vi.fn().mockReturnThis(),
      maybeSingle: maybeSingleMock,
      single: singleMock,
    };

    mockSupabase.from.mockImplementation((table) => {
      return {
        select: vi.fn(() => selectChain),
      };
    });

    const largeFile = new File(
      ["a".repeat(50 * 1024 * 1024 + 1)],
      "large.pdf",
      {
        type: "application/pdf",
      },
    );

    const formData = new FormData();
    formData.append("request_id", "req-1");
    formData.append("receipts", largeFile);

    await expect(submitLiquidation(formData)).rejects.toThrow("File too large");
  });
});
