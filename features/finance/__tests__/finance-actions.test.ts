import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createBudgetRequest,
  submitLiquidation,
  submitScardsForReview,
  cosignScards,
} from "../actions/finance-actions";

const mockGetUser = vi.fn();
const mockRpc = vi.fn();
const mockFrom = vi.fn();
const mockStorage = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        getUser: mockGetUser,
      },
      rpc: mockRpc,
      from: mockFrom,
      storage: mockStorage,
    })
  ),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Finance Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createBudgetRequest throws when user is unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const formData = new FormData();
    formData.append("activity_title", "Test Event");
    formData.append("amount", "5000");

    await expect(createBudgetRequest(formData)).rejects.toThrow("Unauthorized");
  });

  it("createBudgetRequest throws when user lacks permission role", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockRpc.mockResolvedValue({ data: false }); // role check failed

    const formData = new FormData();
    formData.append("activity_title", "Test Event");
    formData.append("amount", "5000");

    await expect(createBudgetRequest(formData)).rejects.toThrow(
      "Unauthorized to submit budget requests"
    );
  });

  it("submitLiquidation throws when user is unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const formData = new FormData();
    formData.append("request_id", "123e4567-e89b-12d3-a456-426614174000");

    await expect(submitLiquidation(formData)).rejects.toThrow("Unauthorized");
  });

  it("submitScardsForReview throws when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    await expect(submitScardsForReview("scard-1")).rejects.toThrow("Unauthorized");
  });

  it("cosignScards throws when user lacks auditor role", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockRpc.mockResolvedValue({ data: false });

    await expect(cosignScards("scard-1")).rejects.toThrow("Unauthorized to co-sign");
  });
});
