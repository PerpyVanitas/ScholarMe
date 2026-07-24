import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { IdleTimeoutProvider } from "@/components/idle-timeout-provider";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

describe("Session Expiry & Inactivity (Phase 3)", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSupabase: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockRouter: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    localStorage.clear();

    mockSupabase = {
      auth: {
        signOut: vi.fn().mockResolvedValue({}),
      },
    };
    vi.mocked(createClient).mockReturnValue(mockSupabase);

    mockRouter = {
      push: vi.fn(),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (vi.mocked(useRouter) as any).mockReturnValue(mockRouter);
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("should detect idle session drop and redirect to login", async () => {
    render(
      <IdleTimeoutProvider>
        <div>Test Content</div>
      </IdleTimeoutProvider>,
    );

    // Fast-forward past the 10-minute timeout
    await act(async () => {
      vi.advanceTimersByTime(11 * 60 * 1000);
    });

    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    expect(mockRouter.push).toHaveBeenCalledWith("/auth/login?reason=inactive");
  });
});
