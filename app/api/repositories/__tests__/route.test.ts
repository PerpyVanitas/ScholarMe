import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "../route";

const mockSupabase = {
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: { id: "test-user-id" } } }),
  },
  from: vi.fn(),
  select: vi.fn(),
  order: vi.fn(),
  range: vi.fn(),
  insert: vi.fn(),
  single: vi.fn(),
};

vi.mock("@/lib/supabase/create-client", () => ({
  createClient: vi.fn(() => mockSupabase),
}));

describe("Repositories API (/api/repositories)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockSupabase.from.mockReturnValue(mockSupabase);
    mockSupabase.select.mockReturnValue(mockSupabase);
    mockSupabase.order.mockReturnValue(mockSupabase);
    mockSupabase.range.mockReturnValue(mockSupabase);
    mockSupabase.insert.mockReturnValue(mockSupabase);
    mockSupabase.single.mockReturnValue(mockSupabase);
  });

  describe("GET", () => {
    it("returns paginated repositories", async () => {
      mockSupabase.range.mockResolvedValueOnce({
        data: [{ id: "repo-1", title: "Test Repo" }],
        error: null,
        count: 1,
      });

      const req = new Request("http://localhost/api/repositories?page=1&limit=10");
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data).toHaveLength(1);
      expect(json.pagination.total).toBe(1);
    });
  });

  describe("POST", () => {
    it("creates a new repository", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: "new-repo", title: "New Repo" },
        error: null,
      });

      const req = new Request("http://localhost/api/repositories", {
        method: "POST",
        body: JSON.stringify({
          title: "New Repo",
          description: "Desc",
        }),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.id).toBe("new-repo");
    });

    it("returns 400 on invalid input", async () => {
      const req = new Request("http://localhost/api/repositories", {
        method: "POST",
        body: JSON.stringify({
          // missing title
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });
});
