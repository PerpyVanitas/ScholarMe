import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const { topic, type = "flashcard", count = 5 } = await req.json();

    if (!topic) {
      return NextResponse.json(
        { error: "Topic is required" },
        { status: 400 }
      );
    }

    // 1. Generate items with Gemini
    const prompt = `
Generate a study set about the following topic: "${topic}".
Generate exactly ${count} items.
The type of items should be: flashcard. 
The answer should be a concise definition or concept explanation.

Output the response strictly as a JSON array of objects with the following keys:
- "question": The term or concept name
- "answer": The definition or explanation

Example:
[
  { "question": "What is the capital of France?", "answer": "Paris" }
]

Respond with ONLY the JSON array. Do not include markdown formatting like \`\`\`json.
`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });


    const responseText = response.text?.trim() || "[]";
    let items;
    
    try {
        // Strip out markdown code blocks if the model still includes them
        let cleanText = responseText;
        if (cleanText.startsWith("\`\`\`json")) {
            cleanText = cleanText.substring(7);
        }
        if (cleanText.endsWith("\`\`\`")) {
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
    console.error("Error generating quiz:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate quiz" },
      { status: 500 }
    );
  }
}
