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
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("aborts fetch requests on unmount", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "test-user-id" } }
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      (_url, options) =>
        new Promise((resolve, reject) => {
          const timer = setTimeout(
            () => resolve({ ok: true, json: async () => ({ data: [] }) }),
            100
          );
          if (options?.signal) {
            if (options.signal.aborted) {
              clearTimeout(timer);
              const err = new Error("aborted");
              err.name = "AbortError";
              reject(err);
            } else {
              options.signal.addEventListener("abort", () => {
                clearTimeout(timer);
                const err = new Error("aborted");
                err.name = "AbortError";
                reject(err);
              });
            }
          }
        })
    );

    const { unmount } = render(<LeaderboardPage />);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    unmount();

    expect(global.fetch).toHaveBeenCalled();
    const fetchArgs = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(fetchArgs[1]).toBeDefined();
    expect(fetchArgs[1].signal).toBeInstanceOf(AbortSignal);

    expect(fetchArgs[1].signal.aborted).toBe(true);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
  });
});
