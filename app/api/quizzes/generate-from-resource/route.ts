/**
 * POST /api/quizzes/generate-from-resource
 * Analyse an uploaded resource file with Gemini and produce quiz questions + flashcards.
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
import { ASSESSMENT_ENGINE_PROMPT } from "@/features/quizzes/api/assessment-engine";
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
  const rlResult = await limiter.check(`gemini_generate_${user.id}`);

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
    const { resource_id, config } = body;

    if (!resource_id) {
      return NextResponse.json(
        { error: "Resource ID is required" },
        { status: 400 },
      );
    }

    // Fetch resource metadata
    const { data: resource, error } = await supabaseAdmin
      .from("resources")
      .select("id, url, title")
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

    // Build prompt from template
    let prompt = ASSESSMENT_ENGINE_PROMPT;
    prompt = prompt.replace("{{USER_CONTEXT}}", config?.user_context || "None");
    prompt = prompt.replace(
      "{{TARGET_CHAPTERS}}",
      config?.target_chapters || "All",
    );
    prompt = prompt.replace(
      "{{TARGET_SUBTOPICS}}",
      config?.target_subtopics || "All",
    );
    prompt = prompt.replace("{{TARGET_PAGES}}", config?.target_pages || "All");
    prompt = prompt.replace(
      "{{QUIZ_TITLE}}",
      config?.quiz_title || resource.title,
    );
    prompt = prompt.replace("{{SUBJECT}}", config?.subject || "General");
    prompt = prompt.replace(
      "{{GENERATE_FLASHCARDS}}",
      config?.generate_flashcards ? "true" : "false",
    );
    prompt = prompt.replace(
      "{{GENERATE_QUIZ}}",
      config?.generate_quiz ? "true" : "false",
    );

    const defaultQuestionTypes = {
      multiple_choice: {
        enabled: true,
        question_count: 5,
        choices_per_question: 4,
      },
    };
    prompt = prompt.replace(
      "{{QUESTION_TYPE_CONFIGURATION}}",
      JSON.stringify(config?.question_types || defaultQuestionTypes, null, 2),
    );

    const defaultDifficulty = { easy: 40, moderate: 40, hard: 20 };
    prompt = prompt.replace(
      "{{DIFFICULTY_DISTRIBUTION}}",
      JSON.stringify(config?.difficulty || defaultDifficulty, null, 2),
    );

    // ── [H1] Lazy client + [M2] Timeout ──────────────────────────────────────
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        prompt,
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
    let items;

    try {
      const match = responseText.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
      items = match ? JSON.parse(match[0]) : JSON.parse(responseText);
    } catch {
      console.error(
        "[quizzes/generate-from-resource] Failed to parse Gemini response:",
        responseText,
      );
      return NextResponse.json(
        { error: "Failed to parse AI response into JSON" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    // ── [L2] Sanitized error ──────────────────────────────────────────────────
    return NextResponse.json(
      { error: logAndSanitizeAIError("quizzes/generate-from-resource", error) },
      { status: 500 },
    );
  }
}
