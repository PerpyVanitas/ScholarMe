import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";
import { createClient as createServerClient } from "@/lib/supabase/server";

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost";
process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-key";
process.env.GOOGLE_GENERATIVE_AI_API_KEY = "mock-ai-key";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table) => {
      if (table === "resource_embeddings") {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({
            data: [
              {
                id: "1",
                content: "AI result",
                resource_id: "res-1",
                embedding: [0.9, 0.1],
              },
              {
                id: "2",
                content: "Other result",
                resource_id: "res-2",
                embedding: [0.1, 0.9],
              },
            ],
            error: null,
          }),
        };
      }
      return {};
    }),
  })),
}));

vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: class {
      models = {
        embedContent: vi.fn().mockResolvedValue({
          embeddings: [{ values: [0.9, 0.1] }],
        }),
      };
    },
  };
});

describe("RAG Search Security Filters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty chunks if user has no accessible resources", async () => {
    vi.mocked(createServerClient).mockResolvedValue({
      auth: {
        getUser: vi
          .fn()
          .mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: [] }),
      }),
    } as never);

    const mockRequest = new Request("http://localhost/api/rag/search", {
      method: "POST",
      body: JSON.stringify({ query: "test query", profileId: "user-1" }),
    });

    const response = await POST(mockRequest);
    const result = await response.json();

    expect(result.chunks).toEqual([]);
  });

  it("should only fetch embeddings for resources the user has access to", async () => {
    vi.mocked(createServerClient).mockResolvedValue({
      auth: {
        getUser: vi
          .fn()
          .mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
      },
      from: vi.fn().mockReturnValue({
        select: vi
          .fn()
          .mockResolvedValue({ data: [{ id: "res-1" }, { id: "res-2" }] }),
      }),
    } as never);

    const mockRequest = new Request("http://localhost/api/rag/search", {
      method: "POST",
      body: JSON.stringify({ query: "test query", profileId: "user-1" }),
    });

    const response = await POST(mockRequest);
    const result = await response.json();

    expect(result.chunks).toContain("AI result");
  });
});
