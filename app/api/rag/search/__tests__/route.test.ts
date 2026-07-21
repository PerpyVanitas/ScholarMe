import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

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
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: [] }), // No resources accessible
      }),
    });

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
      from: vi.fn().mockReturnValue({
        select: vi
          .fn()
          .mockResolvedValue({ data: [{ id: "res-1" }, { id: "res-2" }] }),
      }),
    });

    const mockRequest = new Request("http://localhost/api/rag/search", {
      method: "POST",
      body: JSON.stringify({ query: "test query", profileId: "user-1" }),
    });

    const response = await POST(mockRequest);
    const result = await response.json();

    // The logic sorts by cosine similarity > 0.5. Since query is [0.9, 0.1],
    // "AI result" [0.9, 0.1] will have similarity 1.0 > 0.5.
    expect(result.chunks).toContain("AI result");
  });
});
