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

    const prompt = `
Generate a study set about the following topic: "${topic}".
Generate exactly ${count} items.
The type of items should be: ${type}. 
If the type is 'multiple_choice', the answer should be the correct choice among 4 options, formatted clearly (e.g., "A) option A B) option B C) option C D) option D. Correct: X").
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
