import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { ASSESSMENT_ENGINE_PROMPT } from "@/lib/prompts/assessment-engine";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { resource_id, config } = body;

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

    // Prepare prompt
    let prompt = ASSESSMENT_ENGINE_PROMPT;
    prompt = prompt.replace("{{USER_CONTEXT}}", config?.user_context || "None");
    prompt = prompt.replace("{{TARGET_CHAPTERS}}", config?.target_chapters || "All");
    prompt = prompt.replace("{{TARGET_SUBTOPICS}}", config?.target_subtopics || "All");
    prompt = prompt.replace("{{TARGET_PAGES}}", config?.target_pages || "All");
    prompt = prompt.replace("{{QUIZ_TITLE}}", config?.quiz_title || resource.title);
    prompt = prompt.replace("{{SUBJECT}}", config?.subject || "General");
    prompt = prompt.replace("{{GENERATE_FLASHCARDS}}", config?.generate_flashcards ? "true" : "false");
    prompt = prompt.replace("{{GENERATE_QUIZ}}", config?.generate_quiz ? "true" : "false");
    
    const defaultQuestionTypes = {
      "multiple_choice": { "enabled": true, "question_count": 5, "choices_per_question": 4 }
    };
    prompt = prompt.replace("{{QUESTION_TYPE_CONFIGURATION}}", JSON.stringify(config?.question_types || defaultQuestionTypes, null, 2));
    
    const defaultDifficulty = { "easy": 40, "moderate": 40, "hard": 20 };
    prompt = prompt.replace("{{DIFFICULTY_DISTRIBUTION}}", JSON.stringify(config?.difficulty || defaultDifficulty, null, 2));

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                }
            }
        ],
    });

    const responseText = response.text?.trim() || "{}";
    let items;
    
    try {
        let cleanText = responseText;
        if (cleanText.startsWith("```json")) {
            cleanText = cleanText.substring(7);
        }
        if (cleanText.endsWith("```")) {
            cleanText = cleanText.substring(0, cleanText.length - 3);
        }
        items = JSON.parse(cleanText.trim());
    } catch (parseError) {
        console.error("Failed to parse Gemini response:", responseText);
        return NextResponse.json(
            { error: "Failed to parse AI response into JSON" },
            { status: 500 }
        );
    }

    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    console.error("Error generating from resource:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate from resource" },
      { status: 500 }
    );
  }
}
