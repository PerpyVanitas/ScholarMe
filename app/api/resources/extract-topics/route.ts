import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { STRUCTURE_EXTRACTION_PROMPT } from "@/lib/prompts/structure-extraction";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { resource_id } = body;

    if (!resource_id) {
      return NextResponse.json({ error: "Resource ID is required" }, { status: 400 });
    }

    // Fetch resource
    const { data: resource, error } = await supabaseAdmin
      .from("resources")
      .select("*")
      .eq("id", resource_id)
      .single();

    if (error || !resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    // Download file
    const fileRes = await fetch(resource.url);
    if (!fileRes.ok) {
      return NextResponse.json({ error: "Failed to fetch file from storage" }, { status: 500 });
    }
    
    const arrayBuffer = await fileRes.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = fileRes.headers.get("content-type") || "application/pdf";

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            STRUCTURE_EXTRACTION_PROMPT,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                }
            }
        ],
    });

    const responseText = response.text?.trim() || "{}";
    let topicsData;
    
    try {
        let cleanText = responseText;
        if (cleanText.startsWith("```json")) {
            cleanText = cleanText.substring(7);
        }
        if (cleanText.endsWith("```")) {
            cleanText = cleanText.substring(0, cleanText.length - 3);
        }
        topicsData = JSON.parse(cleanText.trim());
    } catch (parseError) {
        console.error("Failed to parse Gemini response:", responseText);
        return NextResponse.json(
            { error: "Failed to parse AI response into JSON" },
            { status: 500 }
        );
    }

    return NextResponse.json({ success: true, topics: topicsData.topics || [] });
  } catch (error: any) {
    console.error("Error extracting topics:", error);
    return NextResponse.json(
      { error: error.message || "Failed to extract topics" },
      { status: 500 }
    );
  }
}
