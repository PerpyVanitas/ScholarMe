import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";

const mockSupabase = {
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: { id: "test-user-id" } } }),
  },
  from: vi.fn(),
  insert: vi.fn(),
  select: vi.fn(),
  single: vi.fn(),
};

vi.mock("@/lib/supabase/create-client", () => ({
  createClient: vi.fn(() => mockSupabase),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(() => ({
    check: vi.fn().mockResolvedValue({ success: true }),
  })),
}));

describe("POST /api/repositories/[id]/resources", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default chain for mockSupabase
    mockSupabase.from.mockReturnValue(mockSupabase);
    mockSupabase.insert.mockReturnValue(mockSupabase);
    mockSupabase.select.mockReturnValue(mockSupabase);
    mockSupabase.single.mockReturnValue(mockSupabase);
  });

  it("creates a new resource", async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: { id: "new-resource", title: "Test Resource", url: "https://example.com" },
      error: null,
    });

    const req = new Request("http://localhost/api/repositories/repo-1/resources", {
      method: "POST",
      body: JSON.stringify({
        title: "Test Resource",
        url: "https://example.com",
      }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: "repo-1" }) });
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.id).toBe("new-resource");
  });

  it("returns 400 for invalid URL format", async () => {
    const req = new Request("http://localhost/api/repositories/repo-1/resources", {
      method: "POST",
      body: JSON.stringify({
        title: "Test Resource",
        url: "not-a-valid-url",
      }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: "repo-1" }) });
    expect(res.status).toBe(400);
  });
});
