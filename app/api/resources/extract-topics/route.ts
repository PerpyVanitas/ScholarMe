import { handleApiError } from "@/lib/utils/api-error";
/**
 * POST /api/resources/extract-topics
 * Analyse an uploaded resource file with Gemini and extract a table of contents / topic list.
 *
 * Fixes applied:
 *  - [C1] Auth guard — requires a valid Supabase session
 *  - [H1] Lazy client via getAIClient() — fails fast on missing key
 *  - [M2] 60-second timeout via httpOptions
 *  - [L1] File size guard — rejects files > 20 MB before loading into memory
 *  - [L2] Sanitized error messages — full error logged, generic msg to client
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { STRUCTURE_EXTRACTION_PROMPT } from "@/features/quizzes/api/structure-extraction";
import {
  getAIClient,
  GEMINI_MODEL,
  GEMINI_TIMEOUT_MS,
  MAX_FILE_BYTES,
  logAndSanitizeAIError,
} from "@/lib/ai/gemini";
import { rateLimit } from "@/lib/rate-limit";

const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  // ── [C1] Auth gate ────────────────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  // ── [RATE LIMIT] Max 2 generation requests per minute per user ─────────
  const limiter = rateLimit({ interval: 60 * 1000, limit: 2 });
  const rlResult = await limiter.check(`gemini_extract_${user.id}`);

  if (!rlResult.success) {
    return NextResponse.json(
      {
        error:
          "Rate limit exceeded. Please wait 60 seconds before generating again.",
        retryAfter: rlResult.reset,
      },
      { status: 429 },
    );
  }

  try {
    const body = await req.json();
    const { resource_id } = body;

    if (!resource_id) {
      return NextResponse.json(
        { error: "Resource ID is required" },
        { status: 400 },
      );
    }

    // Fetch resource metadata
    const { data: resource, error } = await supabaseAdmin
      .from("resources")
      .select("id, url")
      .eq("id", resource_id)
      .single();

    if (error || !resource) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 },
      );
    }

    // Download file
    const fileRes = await fetch(resource.url);
    if (!fileRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch file from storage" },
        { status: 500 },
      );
    }

    // ── [L1] File size guard — reject before loading into memory ─────────────
    const contentLength = Number(fileRes.headers.get("content-length") || 0);
    if (contentLength > MAX_FILE_BYTES) {
      return NextResponse.json(
        {
          error: `File too large for AI processing (max ${MAX_FILE_BYTES / 1024 / 1024} MB)`,
        },
        { status: 413 },
      );
    }

    const arrayBuffer = await fileRes.arrayBuffer();

    // Double-check size after download (content-length header can be absent/wrong)
    if (arrayBuffer.byteLength > MAX_FILE_BYTES) {
      return NextResponse.json(
        {
          error: `File too large for AI processing (max ${MAX_FILE_BYTES / 1024 / 1024} MB)`,
        },
        { status: 413 },
      );
    }

    const base64Data = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = fileRes.headers.get("content-type") || "application/pdf";

    // ── [H1] Lazy client + [M2] Timeout ──────────────────────────────────────
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        STRUCTURE_EXTRACTION_PROMPT,
        {
          inlineData: {
            data: base64Data,
            mimeType,
          },
        },
      ],
      config: { httpOptions: { timeout: GEMINI_TIMEOUT_MS } },
    });

    const responseText = response.text?.trim() || "{}";
    let topicsData;

    try {
      // Strip optional markdown code fences the model might include
      let cleanText = responseText;
      if (cleanText.startsWith("```json")) cleanText = cleanText.substring(7);
      if (cleanText.startsWith("```")) cleanText = cleanText.substring(3);
      if (cleanText.endsWith("```")) cleanText = cleanText.slice(0, -3);
      topicsData = JSON.parse(cleanText.trim());
    } catch {
      return handleApiError(responseText);
    }

    return NextResponse.json({
      success: true,
      topics: topicsData.topics || [],
    });
  } catch (error) {
    // ── [L2] Sanitized error ──────────────────────────────────────────────────
    return NextResponse.json(
      { error: logAndSanitizeAIError("resources/extract-topics", error) },
      { status: 500 },
    );
  }
}
