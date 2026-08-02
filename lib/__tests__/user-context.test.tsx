import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { UserProvider, useUser } from "../user-context";
import React from "react";

const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
    }),
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    }),
    removeChannel: vi.fn(),
  })),
}));

describe("UserContext & Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws error when useUser is called outside UserProvider", () => {
    expect(() => renderHook(() => useUser())).toThrow("useUser must be used within a UserProvider");
  });

  it("provides default learner role when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <UserProvider>{children}</UserProvider>
    );

    const { result } = renderHook(() => useUser(), { wrapper });

    expect(result.current.role).toBe("learner");
    expect(result.current.profile).toBeNull();
  });
});
