import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor, screen } from "@testing-library/react";
import DashboardView from "../../app/dashboard/components/dashboard-view";
import { useUser } from "@/lib/user-context";
import { createClient } from "@/lib/supabase/client";

// Mock dependencies
vi.mock("@/lib/user-context", () => ({
  useUser: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/hooks/use-dashboard-mode", () => ({
  useDashboardMode: vi.fn(() => ({
    viewMode: "learner",
    setViewMode: vi.fn(),
    canSwitch: false,
  })),
}));

// Mock child components
vi.mock("@/features/admin/components/admin-dashboard", () => ({
  AdminDashboard: () => <div data-testid="admin-dashboard" />
}));
vi.mock("@/features/tutors/components/tutor-dashboard", () => ({
  TutorDashboard: () => <div data-testid="tutor-dashboard" />
}));
vi.mock("@/features/sessions/components/learner-dashboard", () => ({
  LearnerDashboard: () => <div data-testid="learner-dashboard" />
}));

describe("DashboardView Resilience", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("aborts fetching when component unmounts quickly", async () => {
    vi.mocked(useUser).mockReturnValue({
      // @ts-expect-error Mocking partial profile
      profile: { id: "user-123" },
      role: "learner",
      loading: false,
      isAuthenticated: true,
      error: null,
      refetch: vi.fn(),
      clearUser: vi.fn(),
    });

    let abortSignalFromCall: AbortSignal | undefined;
    
    // Setup a mock supabase client with a deliberate delay
    const mockSupabaseClient = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      abortSignal: vi.fn((signal) => {
        abortSignalFromCall = signal;
        return mockSupabaseClient;
      }),
      maybeSingle: vi.fn(() => new Promise(resolve => setTimeout(() => resolve({ data: {} }), 100))),
    };

    // @ts-expect-error Mocking partial Supabase client
    vi.mocked(createClient).mockReturnValue(mockSupabaseClient);

    // Render the component
    const { unmount } = render(<DashboardView />);

    // Wait for the abortSignal to be captured (it happens synchronously in the setup)
    await waitFor(() => {
      expect(abortSignalFromCall).toBeDefined();
    });

    // Unmount before the fetch completes
    unmount();

    // Verify the signal was aborted
    expect(abortSignalFromCall?.aborted).toBe(true);
  });
});
