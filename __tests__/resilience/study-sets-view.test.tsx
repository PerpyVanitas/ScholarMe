import { render, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import StudySetsPage from "@/app/dashboard/study-sets/page";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
  useSearchParams: vi.fn(() => ({
    get: vi.fn(),
  })),
}));

global.fetch = vi.fn();

describe("StudySets Resilience", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("aborts fetch requests on unmount", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    const { unmount } = render(<StudySetsPage />);

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
