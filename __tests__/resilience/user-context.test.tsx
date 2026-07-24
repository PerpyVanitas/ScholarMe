import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { UserProvider, useUser } from "@/lib/user-context";
import { createClient } from "@/lib/supabase/client";

const mockSupabase = {
  auth: {
    getUser: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  maybeSingle: vi.fn(),
  channel: vi.fn(),
  removeChannel: vi.fn(),
};

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => mockSupabase),
}));

// Mock fetch for the role revert
global.fetch = vi.fn();

const TestComponent = () => {
  const { profile, loading } = useUser();
  if (loading) return <div>Loading...</div>;
  return <div>{profile ? profile.full_name : "No profile"}</div>;
};

describe("UserContext Resilience", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    });
    
    mockSupabase.from.mockReturnValue(mockSupabase);
    mockSupabase.select.mockReturnValue(mockSupabase);
    mockSupabase.eq.mockReturnValue(mockSupabase);
    mockSupabase.maybeSingle.mockReturnValue(mockSupabase);
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    });
    mockSupabase.channel.mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn()
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("aborts fetch requests on unmount", async () => {
    // We want to verify that if the component unmounts quickly, the abort signal is passed to fetch
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "test-user-id" } }
    });

    mockSupabase.maybeSingle.mockResolvedValueOnce({
      data: {
        id: "test-user-id",
        full_name: "Test User",
        roles: { name: "admin" },
        role_expires_at: new Date(Date.now() - 10000).toISOString() // Expired role to trigger fetch
      }
    });
    mockSupabase.maybeSingle.mockResolvedValueOnce({
      count: 0 // notifications
    });

    const { unmount } = render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    // Unmount immediately
    unmount();

    // The fetch might still be scheduled, wait a tick
    await act(async () => {
      await new Promise(r => setTimeout(r, 10));
    });

    // Check if fetch was called with a signal
    expect(global.fetch).toHaveBeenCalled();
    const fetchArgs = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(fetchArgs[1]).toBeDefined();
    expect(fetchArgs[1].signal).toBeInstanceOf(AbortSignal);
    
    // The signal should be aborted because we unmounted
    expect(fetchArgs[1].signal.aborted).toBe(true);
  });
});
