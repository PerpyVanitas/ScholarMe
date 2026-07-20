import { handleApiError } from "@/lib/utils/api-error";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function POST(req: NextRequest) {
  try {
    if (!ai) {
      return NextResponse.json(
        { error: "AI not configured. Missing API key." },
        { status: 503 },
      );
    }

    const formData = await req.formData();
    const file = formData.get("receipt") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No receipt file uploaded" },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");

    const prompt = `You are a financial OCR assistant. Analyze the uploaded receipt image.
Extract the following information:
1. vendorName: The name of the store or vendor.
2. totalAmount: The final total amount paid (as a number).

Respond strictly with a JSON object in this format:
{
  "vendorName": "Store Name",
  "totalAmount": 123.45
}`;

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL_ID ?? "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: file.type || "image/jpeg",
                data: base64Data,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text;
    if (!responseText) throw new Error("No response from AI");

    const parsed = JSON.parse(responseText);

    return NextResponse.json({
      vendorName: parsed.vendorName || "Unknown Vendor",
      totalAmount: parsed.totalAmount || 0,
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
