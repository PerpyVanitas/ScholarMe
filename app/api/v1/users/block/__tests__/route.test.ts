import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST, DELETE } from "../route";

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockGetUser = vi.fn();
const mockInsert = vi.fn();
const mockDelete = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: () => ({
      insert: mockInsert,
      delete: () => ({
        eq: () => ({ eq: mockDelete }),
      }),
    }),
  })),
}));

vi.mock("@/lib/logger", () => ({
  routeLogger: () => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  }),
}));

// ── Helpers ────────────────────────────────────────────────────────────────

function makePostRequest(body: object) {
  return new Request("http://localhost/api/v1/users/block", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeDeleteRequest(body: object) {
  return new Request("http://localhost/api/v1/users/block", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("POST /api/v1/users/block", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await POST(makePostRequest({ blocked_id: "123e4567-e89b-12d3-a456-426614174000" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when blocked_id is not a valid UUID", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    const res = await POST(makePostRequest({ blocked_id: "not-a-uuid" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when trying to block yourself", async () => {
    const uid = "123e4567-e89b-12d3-a456-426614174000";
    mockGetUser.mockResolvedValue({ data: { user: { id: uid } } });
    const res = await POST(makePostRequest({ blocked_id: uid }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/yourself/i);
  });

  it("returns 200 on successful block", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "123e4567-e89b-12d3-a456-426614174000" } },
    });
    mockInsert.mockResolvedValue({ error: null });
    const res = await POST(
      makePostRequest({ blocked_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("treats duplicate block (already blocked) as success", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "123e4567-e89b-12d3-a456-426614174000" } },
    });
    // 23505 = unique constraint violation (already blocked)
    mockInsert.mockResolvedValue({ error: { code: "23505" } });
    const res = await POST(
      makePostRequest({ blocked_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" }),
    );
    expect(res.status).toBe(200);
  });

  it("returns 500 on unexpected DB error", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "123e4567-e89b-12d3-a456-426614174000" } },
    });
    mockInsert.mockResolvedValue({ error: { code: "99999", message: "DB down" } });
    const res = await POST(
      makePostRequest({ blocked_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" }),
    );
    expect(res.status).toBe(500);
  });
});

describe("DELETE /api/v1/users/block", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await DELETE(makeDeleteRequest({ blocked_id: "123e4567-e89b-12d3-a456-426614174000" }));
    expect(res.status).toBe(401);
  });

  it("returns 200 on successful unblock", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "123e4567-e89b-12d3-a456-426614174000" } },
    });
    mockDelete.mockResolvedValue({ error: null });
    const res = await DELETE(
      makeDeleteRequest({ blocked_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("returns 500 on DB error during unblock", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "123e4567-e89b-12d3-a456-426614174000" } },
    });
    mockDelete.mockResolvedValue({ error: { message: "constraint error" } });
    const res = await DELETE(
      makeDeleteRequest({ blocked_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" }),
    );
    expect(res.status).toBe(500);
  });
});
