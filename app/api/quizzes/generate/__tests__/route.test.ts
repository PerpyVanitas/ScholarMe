import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";

// Mock Supabase
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "test-user" } }, error: null }),
    },
  })),
}));

// Mock AI client
const generateContentMock = vi.fn();
vi.mock("@/lib/ai/gemini", () => ({
  getAIClient: vi.fn(() => ({
    models: {
      generateContent: generateContentMock,
    },
  })),
  GEMINI_MODEL: "gemini-1.5-pro",
  GEMINI_TIMEOUT_MS: 60000,
  logAndSanitizeAIError: vi.fn(() => "Failed to generate quiz. Please try again."),
}));

describe("POST /api/quizzes/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles valid quiz generation request and returns items", async () => {
    generateContentMock.mockResolvedValueOnce({ 
      text: '[{"question": "Q1", "answer": "A1"}]' 
    });

    const req = new Request("http://localhost/api/quizzes/generate", {
      method: "POST",
      body: JSON.stringify({
        topic: "React",
        type: "multiple_choice",
        count: 1,
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual([{ question: "Q1", answer: "A1" }]);
  });

  it("gracefully degrades when upstream AI call fails (e.g. 500 or timeout)", async () => {
    generateContentMock.mockRejectedValueOnce(new Error("Upstream timeout"));

    const req = new Request("http://localhost/api/quizzes/generate", {
      method: "POST",
      body: JSON.stringify({
        topic: "React",
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("Failed to generate quiz. Please try again.");
  });

  it("returns 400 for invalid request body", async () => {
    const req = new Request("http://localhost/api/quizzes/generate", {
      method: "POST",
      body: JSON.stringify({
        // missing topic
        count: 5,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("handles malformed JSON from AI response gracefully", async () => {
    generateContentMock.mockResolvedValueOnce({ 
      text: 'This is not valid JSON' 
    });

    const req = new Request("http://localhost/api/quizzes/generate", {
      method: "POST",
      body: JSON.stringify({
        topic: "React",
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBeDefined(); // The handleApiError will process this
  });
});
