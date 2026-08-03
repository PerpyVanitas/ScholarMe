import { render, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import StudyModePage from "@/app/dashboard/quizzes/study/[id]/page";
import { Suspense } from "react";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

global.fetch = vi.fn();

describe("Quizzes Study Resilience", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("aborts fetch requests on unmount", async () => {
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

    let unmountFn: () => void;
    await act(async () => {
      const { unmount } = render(
        <Suspense fallback={<div>Loading...</div>}>
          <StudyModePage params={Promise.resolve({ id: "test-id" })} />
        </Suspense>
      );
      unmountFn = unmount;
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    unmountFn!();

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
