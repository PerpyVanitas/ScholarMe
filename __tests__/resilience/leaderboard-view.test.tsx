import { render, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import LeaderboardPage from "@/app/dashboard/leaderboard/page";

const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
};

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => mockSupabase),
}));

global.fetch = vi.fn();

describe("Leaderboard Resilience", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("aborts fetch requests on unmount", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "test-user-id" } }
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    const { unmount } = render(<LeaderboardPage />);

    await act(async () => {
      await new Promise(r => setTimeout(r, 10));
    });

    unmount();

    expect(global.fetch).toHaveBeenCalled();
    const fetchArgs = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(fetchArgs[1]).toBeDefined();
    expect(fetchArgs[1].signal).toBeInstanceOf(AbortSignal);
    
    expect(fetchArgs[1].signal.aborted).toBe(true);
  });
});
