import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { routeLogger } from "@/lib/logger";

const log = routeLogger("/api/ai/chat");

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
        visionContent.push({ type: "text", text: lastUserMsg });
        visionContent.push({
          type: "image_url",
          image_url: { url: imgAttachment.base64 }
        });
      } else {
        const fileSummaries = attachments
          .map((a: { name: string; type: string; content?: string }) => 
            `[Attached File: ${a.name} (${a.type})]${a.content ? `\nContent Preview:\n${a.content.slice(0, 1000)}` : ""}`
          )
          .join("\n\n");
        enrichedQuery = `${lastUserMsg}\n\n${fileSummaries}`;
      }
    }

    if (!apiKey) {
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

    // Call external LLM provider (Groq or OpenAI compatible endpoint)
    const formattedMessages = messages.map((m: { role: string, content: string }, idx: number) => {
      if (idx === messages.length - 1 && m.role === "user") {
        return { role: "user", content: hasVision ? visionContent : enrichedQuery };
      }
      return { role: m.role, content: m.content };
    });

    const endpoint = process.env.GROQ_API_KEY
      ? "https://api.groq.com/openai/v1/chat/completions"
      : "https://api.openai.com/v1/chat/completions";

    let model = process.env.GROQ_API_KEY ? "llama3-8b-8192" : "gpt-3.5-turbo";
    if (hasVision) {
      model = process.env.GROQ_API_KEY ? "llama-3.2-11b-vision-preview" : "gpt-4o-mini";
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      log.error({ errorText }, "LLM Provider Error");
      return NextResponse.json({
        choices: [
          {
            message: {
              role: "assistant",
              content: "I'm having a slight connection issue reaching the AI provider. Let's try again in a moment!",
            },
          },
        ],
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    log.error({ error }, "Server-side AI Error");
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
