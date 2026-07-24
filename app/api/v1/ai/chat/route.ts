import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { routeLogger } from "@/lib/logger";

const log = routeLogger("/api/v1/ai/chat");

// Rate limit for server-side AI endpoint
const aiRateLimiter = rateLimit({ interval: 60 * 1000, limit: 20 }); // 20 requests per minute

const PostBodySchema = z.object({
  messages: z.array(z.object({
    role: z.string(),
    content: z.string(),
  })),
  attachments: z.array(z.object({
    name: z.string(),
    type: z.string(),
    content: z.string().optional(),
    base64: z.string().optional(),
  })).optional(),
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const rateLimitResult = await aiRateLimiter.check(`ai_${user.id}`);
    if (!rateLimitResult.success) {
      return new NextResponse("Rate limit exceeded. Please wait a moment before sending another message.", { status: 429 });
    }

    const parseResult = PostBodySchema.safeParse(await req.json());
    if (!parseResult.success) {
      log.warn({ error: parseResult.error }, "Invalid request body");
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const { messages, attachments } = parseResult.data;

    const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;
    const lastUserMsg = messages[messages.length - 1]?.content || "";

    // Build enriched query incorporating attachments if provided
    let enrichedQuery = lastUserMsg;
    let hasVision = false;
    type VisionPart = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };
    const visionContent: VisionPart[] = [];

    if (attachments && attachments.length > 0) {
      const imgAttachment = attachments.find((a) => a.base64);
      if (imgAttachment && imgAttachment.base64) {
        hasVision = true;
      } else {
        const fileSummaries = attachments
          .map((a: { name: string; type: string; content?: string }) => 
            `[Attached File: ${a.name} (${a.type})]${a.content ? `\nContent Preview:\n${a.content.slice(0, 1000)}` : ""}`
          )
          .join("\n\n");
        enrichedQuery = `${lastUserMsg}\n\n${fileSummaries}`;
      }
    }

    const hasAIConfig = apiKey || process.env.GOOGLE_CLOUD_PROJECT_ID;

    if (!hasAIConfig) {
      // Return a realistic, encouraging Kuya Nicolai response when running locally without LLM API keys
      let simulatedAnswer = `Kamusta! I analyzed your query: "${lastUserMsg.slice(0, 100)}...". As Kuya Nicolai, I recommend breaking this concept down step-by-step!`;

      if (enrichedQuery.toLowerCase().includes("math") || enrichedQuery.toLowerCase().includes("proof")) {
        simulatedAnswer = `Great question on mathematics! Let's approach this Socratically: What is the primary hypothesis or initial condition given in your problem statement? Start by listing your knowns and unknowns!`;
      } else if (enrichedQuery.toLowerCase().includes("data structure") || enrichedQuery.toLowerCase().includes("algorithm")) {
        simulatedAnswer = `For Data Structures & Algorithms, always analyze time complexity! Think about whether an array, linked list, or hash table provides optimal O(1) lookup vs O(n) space trade-offs for this case.`;
      } else if (attachments && attachments.length > 0) {
        simulatedAnswer = `I received your attached study file (${attachments[0].name})! Based on the concepts in your upload, let's review the main key terms and build a flashcard deck to test your recall.`;
      }

      return NextResponse.json({
        choices: [
          {
            message: {
              role: "assistant",
              content: simulatedAnswer,
            },
          },
        ],
      });
    }

    const { getAIClient, GEMINI_MODEL, GEMINI_TIMEOUT_MS, logAndSanitizeAIError } = await import("@/lib/ai/gemini");
    const ai = getAIClient();

    let systemInstruction = "";
    const filteredMessages = messages.filter((m: { role: string, content: string }) => {
      if (m.role === "system") {
        systemInstruction = m.content;
        return false;
      }
      return true;
    });

    const contents = filteredMessages.map((m: { role: string, content: string }, idx: number) => {
      let textContent = m.content;
      const parts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> = [];
      
      // Inject attachments info into the very last user message
      if (idx === filteredMessages.length - 1 && m.role === "user") {
        if (hasVision && attachments) {
          const imgAttachment = attachments.find((a) => a.base64);
          if (imgAttachment && imgAttachment.base64) {
            const base64Data = imgAttachment.base64.includes(",") ? imgAttachment.base64.split(",")[1] : imgAttachment.base64;
            parts.push({
              inlineData: { data: base64Data, mimeType: imgAttachment.type }
            });
          }
        } else {
          textContent = enrichedQuery;
        }
      }
      
      if (textContent) {
        parts.push({ text: textContent });
      }
      
      return {
        role: m.role === "assistant" ? "model" : "user",
        parts
      };
    });

    try {
      const result = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents,
        config: {
          temperature: 0.7,
          httpOptions: { timeout: GEMINI_TIMEOUT_MS },
          ...(systemInstruction ? { systemInstruction } : {})
        }
      });
      
      const replyText = result.text || "No response generated.";

      return NextResponse.json({
        choices: [
          {
            message: {
              role: "assistant",
              content: replyText,
            },
          },
        ],
      });
    } catch (err: unknown) {
      log.error({ error: err }, "LLM Provider Error");
      const clientMsg = await logAndSanitizeAIError("Chat Endpoint", err);
      return NextResponse.json({
        choices: [
          {
            message: {
              role: "assistant",
              content: clientMsg,
            },
          },
        ],
      });
    }
  } catch (error) {
    log.error({ error }, "Server-side AI Error");
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
