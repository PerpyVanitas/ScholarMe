import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../../../app/api/v1/timesheets/route";
import { GET as CRON_GET } from "../../../app/api/v1/cron/timesheets/route";
import { signOut } from "../../../features/auth/actions";
import { NextRequest } from "next/server";

const mockSupabase = {
  auth: {
    getUser: vi.fn(),
    signOut: vi.fn(),
  },
  from: vi.fn(),
};

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => mockSupabase),
}));

vi.mock("@/lib/supabase/create-client", () => ({
  createClient: vi.fn(() => mockSupabase),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => mockSupabase),
}));

vi.mock("@/features/tutors/api/db", () => ({
  ensureTutorRow: vi
    .fn()
    .mockResolvedValue({ ok: true, tutor: { id: "tutor-1" } }),
}));

describe("Integration: Timesheets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("P2-12: Auto clock-out on sign-out", async () => {
    // Mock user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockSupabase.auth.signOut.mockResolvedValue({ error: null });

    const updateMock = vi.fn().mockReturnThis();
    const isMock = vi.fn().mockReturnThis();
    const eqMock = vi.fn().mockReturnThis();
    const selectMock = vi.fn().mockReturnThis();
    const maybeSingleMock = vi
      .fn()
      .mockResolvedValue({ data: { id: "entry-1" } });

    // Wire the chain
    isMock.mockReturnValue({ maybeSingle: maybeSingleMock });
    eqMock.mockReturnValue({ is: isMock, eq: eqMock }); // update uses eq
    selectMock.mockReturnValue({ eq: eqMock });
    updateMock.mockReturnValue({ eq: eqMock });

    mockSupabase.from.mockImplementation((table) => {
      if (table === "timesheets") {
        return {
          select: selectMock,
          update: updateMock,
          eq: eqMock,
          is: isMock,
        };
      }
      return {};
    });

    await signOut();

    expect(updateMock).toHaveBeenCalled();
    expect(isMock).toHaveBeenCalledWith("clock_out", null);
  });

  it("P2-15: Orphaned timesheet cleanup via cron", async () => {
    // We mock process.env for the route
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "dummy_key";

    const threeHoursAgo = new Date(
      Date.now() - 3 * 60 * 60 * 1000,
    ).toISOString();
    const isMock = vi.fn().mockResolvedValue({
      data: [
        { id: "t1", clock_in: threeHoursAgo, last_confirmed_at: threeHoursAgo },
      ],
    });
    const eqMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
    const selectMock = vi.fn().mockReturnValue({ is: isMock });

    mockSupabase.from.mockImplementation((table) => {
      if (table === "timesheets") {
        return {
          update: updateMock,
          select: selectMock,
        };
      }
      return {};
    });

    // The cron route usually doesn't have auth, or uses a secret.
    const req = new NextRequest("http://localhost/api/cron/timesheets");
    await CRON_GET(req);

    expect(updateMock).toHaveBeenCalled();
  });

  it("P2-16: Simultaneous clock-in prevented (Race condition check)", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const configSingleMock = vi.fn().mockResolvedValue({
      data: {
        start_date: "2024-01-01T00:00:00Z",
        end_date: "2030-01-01T00:00:00Z",
      },
    });

    // Simulate NO open entries initially
    const timesheetMaybeSingleMock = vi.fn().mockResolvedValue({ data: null });

    // Simulate successful insertion
    const insertSingleMock = vi
      .fn()
      .mockResolvedValue({ data: { id: "new-1" }, error: null });

    // Race condition check: Simulate finding MULTIPLE open entries AFTER insertion
    const raceCheckIsMock = vi
      .fn()
      .mockResolvedValue({ data: [{ id: "new-1" }, { id: "other-1" }] });

    // Delete mock
    const deleteEqMock = vi.fn().mockResolvedValue({ error: null });

    mockSupabase.from.mockImplementation((table) => {
      if (table === "timesheet_config") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: configSingleMock,
        };
      }
      if (table === "timesheets") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn((field, val) => {
            if (field === "clock_out" && val === null) {
              // We're mocking the race condition check here vs the initial check
              // The initial check uses maybeSingle(), the race check just returns data array.
              return {
                maybeSingle: timesheetMaybeSingleMock,
                then: (cb: unknown) => raceCheckIsMock().then(cb),
              } as never;
            }
            return vi.fn().mockReturnThis();
          }),
          insert: vi.fn().mockReturnThis(),
          single: insertSingleMock,
          delete: vi.fn().mockReturnThis(),
        };
      }
      return {};
    });

    // Inject our raceCheckIsMock explicitly into the flow where it's awaited without `maybeSingle`
    // Actually, the easiest way to mock the `await is("clock_out", null)` is via intercepting the chain.
    // Let's redefine the table mock specifically for this test to handle the execution flow:

    let isCallCount = 0;
    mockSupabase.from.mockImplementation((table) => {
      if (table === "timesheet_config") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: configSingleMock,
        };
      }
      if (table === "timesheets") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn(() => {
            isCallCount++;
            if (isCallCount === 1) {
              return { maybeSingle: timesheetMaybeSingleMock };
            }
            // Second call is the race condition check
            return Promise.resolve({
              data: [{ id: "new-1" }, { id: "other-1" }],
            });
          }),
          insert: vi.fn().mockReturnThis(),
          single: insertSingleMock,
          delete: vi.fn().mockReturnThis(),
        };
      }
      return {};
    });

    const req = new NextRequest("http://localhost/api/timesheets", {
      method: "POST",
      body: JSON.stringify({ action: "clock_in", lat: 0, lng: 0, location_verified: true }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Already clocked in");
  });
});
