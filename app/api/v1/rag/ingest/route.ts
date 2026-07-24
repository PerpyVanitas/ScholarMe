import { handleApiError } from "@/lib/utils/api-error";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const pdfParse = require("pdf-parse");

const IngestSchema = z.object({
  resourceId: z.string().min(1),
  url: z.string().url(),
  profileId: z.string().optional(),
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const aiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

function chunkText(text: string, maxTokens: number = 500): string[] {
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const p of paragraphs) {
    if (currentChunk.length + p.length > maxTokens * 4) {
      chunks.push(currentChunk.trim());
      currentChunk = p;
    } else {
      currentChunk += "\n\n" + p;
    }
  }
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  return chunks;
}

export async function POST(req: Request) {
  try {
    const userClient = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!aiKey) {
      return NextResponse.json(
        { error: "No AI key configured" },
        { status: 500 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const parseResult = IngestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid ingest parameters",
          details: parseResult.error.format(),
        },
        { status: 400 },
      );
    }

    const { resourceId, url } = parseResult.data;

    // 1. Fetch file content
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to fetch file from URL");
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Extract text
    let text = "";
    if (url.toLowerCase().endsWith(".pdf")) {
      const data = await pdfParse(buffer);
      text = data.text;
    } else if (
      url.toLowerCase().endsWith(".txt") ||
      url.toLowerCase().endsWith(".md")
    ) {
      text = buffer.toString("utf-8");
    } else {
      return NextResponse.json({
        status: "skipped",
        message: "Unsupported file type for embedding",
      });
    }

    if (!text.trim()) {
      return NextResponse.json({ status: "skipped", message: "No text found" });
    }

    // 3. Chunk text
    const chunks = chunkText(text);

    // 4. Generate embeddings
    const ai = new GoogleGenAI({ apiKey: aiKey });
    const batchRes = await ai.models.embedContent({
      model: "text-embedding-004",
      contents: chunks,
    });

    const embeddings = batchRes.embeddings || [];

    // 5. Save to database
    const rows = chunks.map((chunk, i) => ({
      resource_id: resourceId,
      profile_id: user.id,
      content: chunk,
      embedding: embeddings[i]?.values || [],
    }));

    const { error } = await supabase.from("resource_embeddings").insert(rows);

    if (error) {
      console.error("DB Insert Error", error);
      throw new Error("Failed to save embeddings to DB");
    }

    return NextResponse.json({ success: true, chunks: chunks.length });
  } catch (err: unknown) {
    console.error("Ingestion error:", err);
    return handleApiError(err);
  }
}
