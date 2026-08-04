/**
 * Shared Gemini AI utilities.
 * - Lazy client instantiation with early misconfiguration detection
 * - Auth strategy: Vertex AI is primary (uses GOOGLE_CLOUD_PROJECT_ID +
 *   Application Default Credentials). Supports three auth modes:
 *     1. GOOGLE_APPLICATION_CREDENTIALS_JSON  — inline service-account JSON
 *        (recommended for Vercel / serverless deployments)
 *     2. GOOGLE_APPLICATION_CREDENTIALS       — path to a key file (local / GCE)
 *     3. gcloud ADC file (local development via `gcloud auth application-default login`)
 *   Falls back to GEMINI_API_KEY / GOOGLE_GENERATIVE_AI_API_KEY when Vertex
 *   AI is not configured.
 * - Standardized timeout handling
 * - Safe error sanitization (full error logged server-side, generic message to client)
 */
import { writeFileSync } from "fs";
import { GoogleGenAI } from "@google/genai";

export const GEMINI_MODEL = "gemini-2.0-flash";

/**
 * Lazily create a GoogleGenAI client.
 *
 * Auth priority:
 *  1. GOOGLE_CLOUD_PROJECT_ID  → Vertex AI (primary)
 *     Credentials are resolved in this order:
 *       a) GOOGLE_APPLICATION_CREDENTIALS_JSON  (inline JSON, ideal for Vercel)
 *       b) GOOGLE_APPLICATION_CREDENTIALS       (file path, local / GCE)
 *       c) Well-known gcloud ADC file           (local dev)
 *  2. GEMINI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, GROQ_API_KEY, or OPENAI_API_KEY → Gemini / LLM API key
 *
 * If neither is configured an error is thrown immediately so
 * misconfiguration surfaces before the first AI request.
 */
export function isValidApiKey(key?: string | null): boolean {
  if (!key || typeof key !== "string") return false;
  let trimmed = key.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  if (trimmed.length < 10) return false;
  // Ignore placeholders or keys with spaces
  if (
    trimmed.startsWith("YOUR_") ||
    trimmed.includes(" ") ||
    trimmed === "placeholder"
  ) {
    return false;
  }
  return true;
}

export function getAIClient(): GoogleGenAI {
  // ── Standard Gemini / Express API Key ───────────────────────────────────
  const rawApiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GROQ_API_KEY ||
    process.env.OPENAI_API_KEY;

  let apiKey = isValidApiKey(rawApiKey) ? rawApiKey!.trim() : undefined;
  if (apiKey) {
    if (
      (apiKey.startsWith('"') && apiKey.endsWith('"')) ||
      (apiKey.startsWith("'") && apiKey.endsWith("'"))
    ) {
      apiKey = apiKey.slice(1, -1).trim();
    }
    return new GoogleGenAI({ apiKey });
  }

  // ── Vertex AI (GCP Project Mode) ─────────────────────────────────────────
  const project = process.env.GOOGLE_CLOUD_PROJECT_ID;

  if (project) {
    const credJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    if (credJson && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const tmpPath = "/tmp/gcp-sa-key.json";
      try {
        writeFileSync(tmpPath, credJson, { encoding: "utf8" });
        process.env.GOOGLE_APPLICATION_CREDENTIALS = tmpPath;
      } catch {
        // Non-fatal — google-auth-library will fall through to the next strategy
      }
    }

    const location = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
    return new GoogleGenAI({ vertexai: true, project, location });
  }

  throw new Error(
    "AI service is not configured. Set GOOGLE_CLOUD_PROJECT_ID (+ run " +
      "`gcloud auth application-default login` locally, or set " +
      "GOOGLE_APPLICATION_CREDENTIALS_JSON on Vercel) for Vertex AI, " +
      "or set GEMINI_API_KEY for the standard Gemini API.",
  );
}

/**
 * Log the full SDK error server-side and return a safe generic string for
 * the client. Prevents leaking quota details, project IDs, or internal URLs.
 */
export function logAndSanitizeAIError(context: string, error: unknown): string {
  console.error(`[AI Error — ${context}]`, error);
  if (
    error instanceof Error &&
    (error.message.includes("GEMINI_API_KEY") ||
      error.message.includes("GOOGLE_CLOUD_PROJECT_ID") ||
      error.message.includes("AI service is not configured"))
  ) {
    return "AI service is not configured. Please contact support.";
  }
  return "AI generation failed. Please try again later.";
}

/**
 * Hard cap on file sizes accepted by document-based AI routes.
 * Prevents loading huge blobs into serverless function memory.
 */
export const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 MB

/**
 * Gemini request timeout in milliseconds.
 * Passed via httpOptions so the SDK itself aborts the connection cleanly.
 */
export const GEMINI_TIMEOUT_MS = 60_000; // 60 s
