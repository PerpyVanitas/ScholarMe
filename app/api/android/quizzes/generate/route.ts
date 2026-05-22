import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createSupabaseForBearer } from "@/lib/supabase/bearer-client";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function getBearerToken(request: Request): string | null {
  const h = request.headers.get("authorization");
  return h?.startsWith("Bearer ") ? h.substring(7) : null;
}

export async function POST(req: Request) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
    }

    const { title, topic: rawTopic, description = "", type = "multiple_choice", count: rawCount = 5, is_public = false } = await req.json();

    const topic = String(rawTopic || "").slice(0, 500);
    const count = Math.min(Math.max(1, Number(rawCount)), 20);

    if (!title || !topic) {
      return NextResponse.json({ success: false, error: { message: "Title and topic are required" } }, { status: 400 });
    }

    const supabase = createSupabaseForBearer(token);
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return NextResponse.json({ success: false, error: { message: "Invalid token" } }, { status: 401 });
    }

    // 1. Generate items with Gemini
    const prompt = `
Generate a study set about the following topic: "${topic}".
Generate exactly ${count} items.
The type of items should be: ${type}. 
If the type is 'multiple_choice', the answer should be the correct choice among 4 options, formatted clearly.
If the type is 'true_false', the answer should be strictly "True" or "False".
(Note: 'flashcard' type is not supported in this endpoint).

Output the response strictly as a JSON array of objects with the following keys:
- "question": The question text
- "answer": The answer text

Example for multiple_choice:
[
  { "question": "What is the capital of France?", "answer": "A) Berlin B) Madrid C) Paris D) Rome. Correct: C" }
]

Respond with ONLY the JSON array. Do not include markdown formatting like \`\`\`json.
`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    const responseText = response.text?.trim() || "[]";
    let generatedItems;
    try {
        let cleanText = responseText;
        if (cleanText.startsWith("\`\`\`json")) cleanText = cleanText.substring(7);
        if (cleanText.endsWith("\`\`\`")) cleanText = cleanText.substring(0, cleanText.length - 3);
        generatedItems = JSON.parse(cleanText.trim());
    } catch (parseError) {
        console.error("Failed to parse Gemini response:", responseText);
        return NextResponse.json({ success: false, error: { message: "Failed to parse AI response" } }, { status: 500 });
    }

    // 2. Create the study set
    const { data: studySet, error: setError } = await supabase
        .from("study_sets")
        .insert({
            title,
            description,
            user_id: authData.user.id,
            owner_id: authData.user.id,
            source_type: "ai_generated",
            generation_mode: type,
            is_public: is_public,
            visibility: is_public ? "public" : "private"
        })
        .select()
        .single();

    if (setError || !studySet) {
        throw setError || new Error("Failed to create study set");
    }

    // 3. Insert the items
    const itemsToInsert = generatedItems.map((item: any, index: number) => ({
        study_set_id: studySet.id,
        item_type: type,
        question: item.question,
        prompt: item.question,
        answer: item.answer,
        display_order: index,
        order_index: index,
    }));

    const { data: insertedItems, error: itemsError } = await supabase
        .from("study_set_items")
        .insert(itemsToInsert)
        .select();

    if (itemsError) {
        throw itemsError;
    }

    // Format response to match Android expectations
    return NextResponse.json({
        success: true,
        data: {
            studySet: {
                id: studySet.id,
                title: studySet.title,
                description: studySet.description,
                type: studySet.generation_mode,
                createdAt: studySet.created_at,
            },
            items: insertedItems.map((item) => ({
                id: item.id,
                question: item.question,
                answer: item.answer,
                type: item.item_type
            }))
        }
    });

  } catch (error: any) {
    console.error("Error generating quiz for Android:", error);
    return NextResponse.json({ success: false, error: { message: error.message || "Failed to generate quiz" } }, { status: 500 });
  }
}
