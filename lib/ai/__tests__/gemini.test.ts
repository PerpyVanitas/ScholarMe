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
    // Start each test with a clean slate — no AI config
    delete process.env.GOOGLE_CLOUD_PROJECT_ID;
    delete process.env.GOOGLE_CLOUD_LOCATION;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("exports expected constants", () => {
    expect(GEMINI_MODEL).toBe("gemini-3.6-flash");
    expect(MAX_FILE_BYTES).toBe(20 * 1024 * 1024);
    expect(GEMINI_TIMEOUT_MS).toBe(60_000);
  });

  // ── Vertex AI (primary) ────────────────────────────────────────────────────

  it("creates a Vertex AI client when GOOGLE_CLOUD_PROJECT_ID is set", () => {
    process.env.GOOGLE_CLOUD_PROJECT_ID = "test-project";
    process.env.GOOGLE_CLOUD_LOCATION = "us-east1";

    const client = getAIClient();

    expect(client).toBeDefined();
    expect((client as unknown as { config: { vertexai: boolean } }).config.vertexai).toBe(true);
    expect((client as unknown as { config: { project: string } }).config.project).toBe("test-project");
    expect((client as unknown as { config: { location: string } }).config.location).toBe("us-east1");
  });

  it("uses default location us-central1 when GOOGLE_CLOUD_LOCATION is unset", () => {
    process.env.GOOGLE_CLOUD_PROJECT_ID = "test-project";

    const client = getAIClient();

    expect((client as unknown as { config: { location: string } }).config.location).toBe("us-central1");
  });

  it("sets GOOGLE_APPLICATION_CREDENTIALS to /tmp path when GOOGLE_APPLICATION_CREDENTIALS_JSON is provided", () => {
    process.env.GOOGLE_CLOUD_PROJECT_ID = "test-project";
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON = JSON.stringify({ type: "service_account" });

    // The function should not throw and should set GOOGLE_APPLICATION_CREDENTIALS
    // so google-auth-library can pick it up from the written /tmp file.
    expect(() => getAIClient()).not.toThrow();
    expect(process.env.GOOGLE_APPLICATION_CREDENTIALS).toBe("/tmp/gcp-sa-key.json");

    delete process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
  });

  // ── API key fallback ───────────────────────────────────────────────────────

  it("falls back to GEMINI_API_KEY when GOOGLE_CLOUD_PROJECT_ID is absent", () => {
    process.env.GEMINI_API_KEY = "test-api-key";

    const client = getAIClient();

    expect(client).toBeDefined();
    expect((client as unknown as { config: { apiKey: string } }).config.apiKey).toBe("test-api-key");
    // Must NOT set vertexai: true in fallback mode
    expect((client as unknown as { config: { vertexai?: boolean } }).config.vertexai).toBeUndefined();
  });

  it("falls back to GOOGLE_GENERATIVE_AI_API_KEY when GEMINI_API_KEY is absent", () => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "legacy-api-key";

    const client = getAIClient();

    expect((client as unknown as { config: { apiKey: string } }).config.apiKey).toBe("legacy-api-key");
  });

  // ── Misconfiguration ───────────────────────────────────────────────────────

  it("throws when neither Vertex AI nor an API key is configured", () => {
    expect(() => getAIClient()).toThrow("AI service is not configured");
  });

  // ── logAndSanitizeAIError ──────────────────────────────────────────────────

  it("returns config message for misconfiguration errors", () => {
    const error = new Error("GEMINI_API_KEY is not set");
    expect(logAndSanitizeAIError("chat", error)).toBe(
      "AI service is not configured. Please contact support.",
    );
  });

  it("returns config message for AI-not-configured errors", () => {
    const error = new Error("AI service is not configured. Set GOOGLE_CLOUD_PROJECT_ID");
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
