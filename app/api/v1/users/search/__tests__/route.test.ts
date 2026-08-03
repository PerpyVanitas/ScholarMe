import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../route";

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockGetUser = vi.fn();
const mockProfileSelect = vi.fn();
const mockBlocksSelect1 = vi.fn();
const mockBlocksSelect2 = vi.fn();
const mockSearchSelect = vi.fn();
const mockRoleSelect = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: (table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({ maybeSingle: mockProfileSelect }),
            ilike: () => ({ limit: mockSearchSelect }),
          }),
        };
      }
      if (table === "roles") {
        return {
          select: () => ({ eq: () => ({ maybeSingle: mockRoleSelect }) }),
        };
      }
      if (table === "user_blocks") {
        // Alternate between the two block queries
        let callCount = 0;
        return {
          select: () => ({
            eq: (col: string) => ({
              eq: (col2: string, val: string) =>
                callCount++ === 0
                  ? { data: [], error: null }
                  : { data: [], error: null },
            }),
          }),
        };
      }
      return {};
    },
  })),
}));

vi.mock("@/lib/utils/roles", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/utils/roles")>();
  return { ...actual };
});

// ── Helper ─────────────────────────────────────────────────────────────────

function makeRequest(q: string) {
  return new Request(`http://localhost/api/v1/users/search?q=${encodeURIComponent(q)}`);
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("GET /api/v1/users/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const res = await GET(makeRequest("alice"));
    expect(res.status).toBe(401);
  });

  it("returns 400 for query shorter than 2 chars", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });

    const res = await GET(makeRequest("a"));
    expect(res.status).toBe(400);
  });

  it("returns results for a tutor+ caller (all roles)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    mockProfileSelect.mockResolvedValue({
      data: { role_id: "r1", roles: [{ name: "tutor" }] },
      error: null,
    });
    mockBlocksSelect1.mockResolvedValue({ data: [], error: null });
    mockBlocksSelect2.mockResolvedValue({ data: [], error: null });
    mockSearchSelect.mockResolvedValue({
      data: [
        { id: "u2", full_name: "Alice Doe", avatar_url: null, roles: [{ name: "learner" }] },
      ],
      error: null,
    });

    const res = await GET(makeRequest("Alice"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it("excludes the caller from results", async () => {
    const CALLER_ID = "caller-uuid";
    mockGetUser.mockResolvedValue({ data: { user: { id: CALLER_ID } } });
    mockProfileSelect.mockResolvedValue({
      data: { role_id: "r1", roles: [{ name: "tutor" }] },
      error: null,
    });
    mockSearchSelect.mockResolvedValue({
      data: [
        { id: CALLER_ID, full_name: "Self User", avatar_url: null },
        { id: "u99", full_name: "Other User", avatar_url: null },
      ],
      error: null,
    });

    const res = await GET(makeRequest("User"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.every((u: { id: string }) => u.id !== CALLER_ID)).toBe(true);
  });

  it("blocks are excluded from results", async () => {
    const BLOCKED_ID = "blocked-uuid";
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    mockProfileSelect.mockResolvedValue({
      data: { role_id: "r1", roles: [{ name: "tutor" }] },
      error: null,
    });
    mockSearchSelect.mockResolvedValue({
      data: [
        { id: BLOCKED_ID, full_name: "Blocked User", avatar_url: null },
        { id: "u2", full_name: "Visible User", avatar_url: null },
      ],
      error: null,
    });

    // Override createClient to return a block for BLOCKED_ID
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockReturnValue({
      auth: { getUser: mockGetUser },
      from: (table: string) => {
        if (table === "user_blocks") {
          return {
            select: () => ({
              eq: () => ({ data: [{ blocked_id: BLOCKED_ID }], error: null }),
            }),
          };
        }
        if (table === "profiles") {
          return {
            select: () => ({
              eq: () => ({ maybeSingle: mockProfileSelect }),
              ilike: () => ({ limit: mockSearchSelect }),
            }),
          };
        }
        return {};
      },
    } as unknown as ReturnType<typeof createClient>);

    const res = await GET(makeRequest("User"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.every((u: { id: string }) => u.id !== BLOCKED_ID)).toBe(true);
  });
});
