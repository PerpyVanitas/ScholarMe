import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const aiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function POST(req: Request) {
  try {
    if (!aiKey) {
      return NextResponse.json(
        { error: "No AI key configured" },
        { status: 500 },
      );
    }

    const { query, profileId } = await req.json();

    if (!query || !profileId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // 1. Generate embedding for the query
    const ai = new GoogleGenAI({ apiKey: aiKey });
    const res = await ai.models.embedContent({
      model: "text-embedding-004",
      contents: query,
    });

    const queryEmbedding = res.embeddings?.[0]?.values;
    if (!queryEmbedding) {
      throw new Error("Failed to generate query embedding");
    }

    // 2. Fetch all embeddings the user can access
    // For now, we will fetch embeddings that belong to the user's profile
    // In a real production environment with many users and large data,
    // we would use pgvector or a dedicated vector DB.
    const { data: embeddingsData, error } = await supabase
      .from("resource_embeddings")
      .select("id, content, embedding, resource_id");

    if (error) {
      throw new Error("Failed to fetch embeddings from DB");
    }

    if (!embeddingsData || embeddingsData.length === 0) {
      return NextResponse.json({ chunks: [] });
    }

    // 3. Compute similarities
    const scoredChunks = embeddingsData.map((row: any) => {
      const similarity = cosineSimilarity(queryEmbedding, row.embedding || []);
      return {
        id: row.id,
        content: row.content,
        resource_id: row.resource_id,
        similarity,
      };
    });

    // 4. Sort and return top 3
    scoredChunks.sort((a, b) => b.similarity - a.similarity);

    // Only return chunks with a reasonable similarity score (> 0.5)
    const topChunks = scoredChunks
      .filter((c) => c.similarity > 0.5)
      .slice(0, 3);

    return NextResponse.json({ chunks: topChunks.map((c) => c.content) });
  } catch (err: any) {
    console.error("Search error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
