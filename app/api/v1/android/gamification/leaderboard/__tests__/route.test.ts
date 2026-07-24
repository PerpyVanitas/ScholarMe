import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../route";

const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
  select: vi.fn(),
  order: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => mockSupabase),
}));

describe("GET /api/android/gamification/leaderboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase.from.mockReturnValue(mockSupabase);
    mockSupabase.select.mockReturnValue(mockSupabase);
    mockSupabase.order.mockReturnValue(mockSupabase);
  });

  it("returns 401 if user is not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } });

    const req = new Request("http://localhost/api/android/gamification/leaderboard");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
  });

  it("returns 400 for invalid query parameters", async () => {
    const req = new Request("http://localhost/api/android/gamification/leaderboard?limit=0");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toBe("Invalid query parameters");
  });

  it("successfully fetches leaderboard data", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ 
      data: { user: { id: "user-2" } } 
    });

    mockSupabase.order.mockResolvedValueOnce({
      data: [
        {
          user_id: "user-1",
          experience_points: 1000,
          level: 10,
          profiles: [{ full_name: "User One", avatar_url: "url1" }]
        },
        {
          user_id: "user-2",
          experience_points: 500,
          level: 5,
          profiles: { full_name: "User Two", avatar_url: "url2" } // Testing non-array return too
        }
      ],
      error: null
    });

    const req = new Request("http://localhost/api/android/gamification/leaderboard?limit=10");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.leaderboard).toHaveLength(2);
    expect(json.data.leaderboard[0].rank).toBe(1);
    expect(json.data.leaderboard[1].rank).toBe(2);
    expect(json.data.leaderboard[1].isCurrentUser).toBe(true);
    expect(json.data.currentUserEntry).toBeNull(); // Because rank is within limit
  });
  
  it("includes currentUserEntry if current user rank is outside limit", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ 
      data: { user: { id: "user-3" } } 
    });

    mockSupabase.order.mockResolvedValueOnce({
      data: [
        { user_id: "user-1", experience_points: 1000, level: 10, profiles: [] },
        { user_id: "user-2", experience_points: 500, level: 5, profiles: [] },
        { user_id: "user-3", experience_points: 100, level: 1, profiles: [] }
      ],
      error: null
    });

    const req = new Request("http://localhost/api/android/gamification/leaderboard?limit=2");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.leaderboard).toHaveLength(2);
    expect(json.data.currentUserEntry).toBeDefined();
    expect(json.data.currentUserEntry.rank).toBe(3);
    expect(json.data.currentUserEntry.isCurrentUser).toBe(true);
  });

  it("handles database errors gracefully", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ 
      data: { user: { id: "user-1" } } 
    });

    mockSupabase.order.mockResolvedValueOnce({
      data: null,
      error: new Error("Database connection failed")
    });

    const req = new Request("http://localhost/api/android/gamification/leaderboard");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error).toBe("Database connection failed");
  });
});
