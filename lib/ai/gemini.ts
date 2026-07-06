/**
 * Shared Gemini AI utilities.
 * - Lazy client instantiation with early misconfiguration detection
 * - Standardized timeout handling
 * - Safe error sanitization (full error logged server-side, generic message to client)
 */
import { GoogleGenAI } from "@google/genai";

export const GEMINI_MODEL = "gemini-2.5-flash";

/** Lazily create a GoogleGenAI client, failing fast if the key is missing. */
export function getAIClient(): GoogleGenAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY environment variable is not configured. " +
        "Check your .env.local and deployment environment settings.",
    );
  }
  return new GoogleGenAI({ apiKey: key });
}

/**
 * Log the full SDK error server-side and return a safe generic string for
 * the client. Prevents leaking quota details, project IDs, or internal URLs.
 */
export function logAndSanitizeAIError(context: string, error: unknown): string {
  console.error(`[AI Error — ${context}]`, error);
  if (error instanceof Error && error.message.includes("GEMINI_API_KEY")) {
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
