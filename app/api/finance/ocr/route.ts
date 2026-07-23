import { z } from "zod";
import { handleApiError } from "@/lib/utils/api-error";
import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { DocumentProcessorServiceClient } from "@google-cloud/documentai";
import { getAIClient, GEMINI_MODEL } from "@/lib/ai/gemini";

const docaiClient = new DocumentProcessorServiceClient();

// Define a Zod schema for the expected fields from req.formData()
const receiptUploadSchema = z.object({
  receipt: z.instanceof(File).optional(), // Expecting a File object, and it's optional before the explicit check
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Call req.formData() and then validate with Zod
    const rawFormData = await req.formData();
    const parsedFormData = receiptUploadSchema.safeParse(Object.fromEntries(rawFormData.entries()));

    if (!parsedFormData.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // Extract the validated 'receipt' file, which will be File | undefined
    const file = parsedFormData.data.receipt;

    if (!file) {
      return NextResponse.json(
        { error: "No receipt file uploaded" },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");

    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const location = process.env.GOOGLE_CLOUD_LOCATION || "us";
    const processorId = process.env.DOCUMENT_AI_PROCESSOR_ID;

    // Try Document AI first
    if (projectId && processorId) {
      try {
        const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;
        const request = {
          name,
          rawDocument: {
            content: base64Data,
            mimeType: file.type || "image/jpeg",
          },
        };
        const [result] = await docaiClient.processDocument(request);
        const { document } = result;

        let vendorName = "Unknown Vendor";
        let totalAmount = 0;

        if (document?.entities) {
          for (const entity of document.entities) {
            if (entity.type === "supplier_name" && !vendorName.startsWith("Unknown")) {
              vendorName = entity.mentionText || vendorName;
            } else if (entity.type === "supplier_name") {
              vendorName = entity.mentionText || vendorName;
            }
            if (entity.type === "total_amount") {
              totalAmount = parseFloat(entity.normalizedValue?.text || entity.mentionText || "0");
            }
          }
        }

        return NextResponse.json({
          vendorName,
          totalAmount,
        });
      } catch (docaiError) {
        console.warn("[Document AI Error] Falling back to Gemini:", docaiError);
      }
    }

    // Fallback to Gemini
    let ai;
    try {
      ai = getAIClient();
    } catch (configError) {
      return NextResponse.json(
        { error: "AI not configured. Missing API key or Project ID." },
        { status: 503 },
      );
    }

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
      model: GEMINI_MODEL,
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
