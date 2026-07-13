import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";

// Use require for pdf-parse to avoid TypeScript default export issues with its ESM build

const pdfParse = require("pdf-parse");

// We have to use the service role key to insert embeddings securely or just standard NEXT_PUBLIC if RLS allows.
// resource_embeddings has no RLS right now since it's just a raw table created via script.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const aiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

function chunkText(text: string, maxTokens: number = 500): string[] {
  // A simple chunker based on paragraphs and words
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const p of paragraphs) {
    if (currentChunk.length + p.length > maxTokens * 4) {
      // rough character estimate
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
    if (!aiKey) {
      return NextResponse.json(
        { error: "No AI key configured" },
        { status: 500 },
      );
    }

    const { resourceId, url, profileId } = await req.json();

    if (!resourceId || !url || !profileId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

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
      // Unsupported type for now, just silently return success so we don't break the frontend
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

    // Check if the response contains multiple embeddings (one for each chunk)
    const embeddings = batchRes.embeddings || [];

    // 5. Save to database
    const rows = chunks.map((chunk, i) => ({
      resource_id: resourceId,
      profile_id: profileId,
      content: chunk,
      embedding: embeddings[i]?.values || [],
    }));

    const { error } = await supabase.from("resource_embeddings").insert(rows);

    if (error) {
      console.error("DB Insert Error", error);
      throw new Error("Failed to save embeddings to DB");
    }

    return NextResponse.json({ success: true, chunks: chunks.length });
  } catch (err: any) {
    console.error("Ingestion error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
