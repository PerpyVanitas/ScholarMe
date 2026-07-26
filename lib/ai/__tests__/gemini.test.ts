import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getAIClient,
  logAndSanitizeAIError,
  MAX_FILE_BYTES,
  GEMINI_TIMEOUT_MS,
  GEMINI_MODEL,
} from "../gemini";

vi.mock("@google/genai", () => ({
  GoogleGenAI: class MockGoogleGenAI {
    config: unknown;
    constructor(config: unknown) {
      this.config = config;
    }
  },
}));

describe("Gemini utilities", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.GOOGLE_CLOUD_PROJECT_ID = "test-project";
    process.env.GOOGLE_CLOUD_LOCATION = "us-east1";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("exports expected constants", () => {
    expect(GEMINI_MODEL).toBe("gemini-2.5-flash");
    expect(MAX_FILE_BYTES).toBe(20 * 1024 * 1024);
    expect(GEMINI_TIMEOUT_MS).toBe(60_000);
  });

  it("creates AI client when project is configured", () => {
    const client = getAIClient();

    expect(client).toBeDefined();
    expect((client as { config: { project: string } }).config.project).toBe(
      "test-project",
    );
  });

  it("uses default location when GOOGLE_CLOUD_LOCATION is unset", () => {
    delete process.env.GOOGLE_CLOUD_LOCATION;

    const client = getAIClient();

    expect((client as { config: { location: string } }).config.location).toBe(
      "us-central1",
    );
  });

  it("throws when GOOGLE_CLOUD_PROJECT_ID is missing", () => {
    delete process.env.GOOGLE_CLOUD_PROJECT_ID;

    expect(() => getAIClient()).toThrow("GOOGLE_CLOUD_PROJECT_ID");
  });

  it("returns config message for misconfiguration errors", () => {
    const error = new Error("GEMINI_API_KEY is not set");
    expect(logAndSanitizeAIError("chat", error)).toBe(
      "AI service is not configured. Please contact support.",
    );
  });

  it("returns generic message for other errors", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(logAndSanitizeAIError("chat", new Error("quota exceeded"))).toBe(
      "AI generation failed. Please try again later.",
    );
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
