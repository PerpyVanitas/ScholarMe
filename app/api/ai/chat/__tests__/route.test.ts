import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";

// Mock Supabase
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "test-user" } } }),
    },
  })),
}));

// Mock rate limiter
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(() => ({
    check: vi.fn().mockResolvedValue({ success: true }),
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
  logAndSanitizeAIError: vi.fn(() => "An AI error occurred. Please try again."),
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  routeLogger: vi.fn(() => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  })),
}));

describe("POST /api/ai/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GOOGLE_CLOUD_PROJECT_ID = "test-project-id";
  });

  it("handles valid chat request and returns AI response", async () => {
    generateContentMock.mockResolvedValueOnce({ text: "Hello from AI!" });

    const req = new Request("http://localhost/api/ai/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hi" }],
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.choices[0].message.content).toBe("Hello from AI!");
  });

  it("gracefully degrades when upstream AI call fails (e.g. 500 or timeout)", async () => {
    // Simulate upstream timeout or error
    generateContentMock.mockRejectedValueOnce(new Error("Upstream timeout"));

    const req = new Request("http://localhost/api/ai/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hi" }],
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    // The route catches the error and returns 200 with a fallback message in choices
    expect(res.status).toBe(200);
    expect(json.choices[0].message.content).toBe("An AI error occurred. Please try again.");
  });

  it("returns 400 for invalid request body", async () => {
    const req = new Request("http://localhost/api/ai/chat", {
      method: "POST",
      body: JSON.stringify({
        bad_field: "value",
      }), // Missing messages array
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("falls back to simulated response if no AI config is present", async () => {
    delete process.env.GOOGLE_CLOUD_PROJECT_ID;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GROQ_API_KEY;
    delete process.env.OPENAI_API_KEY;

    const req = new Request("http://localhost/api/ai/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "How do I do math?" }],
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.choices[0].message.content).toContain("Great question on mathematics!");
    expect(generateContentMock).not.toHaveBeenCalled();
  });
});
