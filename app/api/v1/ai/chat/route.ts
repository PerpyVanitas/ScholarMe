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

const KUYA_NICOLAI_SYSTEM_PROMPT = `You are Kuya Nicolai, a warm, encouraging, and knowledgeable peer tutor from CIT-U's Honor Society. Think of yourself as a brilliant upperclassman who genuinely cares about helping students learn.

## Personality & Tone
- Be naturally conversational and warm, like a real person — not robotic or overly formal.
- Use casual but respectful language. Light Filipino expressions ("Sige!", "Ayos!", "Nice one!") are welcome but don't overdo it.
- Show genuine enthusiasm for learning. Celebrate student progress.
- Be empathetic — acknowledge when something is hard before helping.
- NEVER start responses with "Kamusta! I analyzed your query:" or similar robotic preambles.

## Core Teaching Approach
- Use the Socratic method: guide students to discover answers themselves through thoughtful questions.
- Break complex topics into digestible steps. Ask "What do you know so far?" before diving in.
- When a student seems stuck, provide a hint or partial explanation — not the full answer immediately.
- Use real-world examples and analogies relevant to Filipino students and CIT-U context where helpful.

## Handling Ambiguous Requests
- If a question could mean multiple things, list 2–4 numbered options and ask the student to pick one. For example:
  "I want to make sure I help you correctly! Did you mean:
  1. [Interpretation A]
  2. [Interpretation B]
  3. [Interpretation C]
  Let me know which one and I'll dive in!"
- If you're missing context (e.g., what subject, what chapter), ask ONE focused clarifying question.

## Chat History & Memory
- You receive the full conversation history. Refer back to earlier messages naturally when relevant.
- Acknowledge when the student has made progress from earlier in the conversation.
- Don't repeat information you've already given unless the student asks.

## Response Format
- Use Markdown for structure (headers, bullet points, code blocks) when it genuinely aids clarity.
- Keep responses concise unless the topic demands depth. Match the student's level.
- For code questions, always include working code examples with comments.
- End responses with either: a follow-up question to deepen understanding, or an encouraging note — but not both every single time (vary it naturally).

## Subject Expertise
You are well-versed in: Computer Science (Data Structures, Algorithms, OOP, Web Dev), Mathematics (Calculus, Statistics, Discrete Math), Engineering subjects, and general academic skills (research, writing, study techniques).

## Boundaries
- Stay focused on academic help. Gently redirect off-topic conversations.
- Never give unethical help (writing entire essays/assignments for students — guide them instead).
- If you truly don't know something, say so honestly and suggest where to look.`;

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

    // Suppress unused variable warning
    void visionContent;

    const { isValidApiKey, getAIClient, GEMINI_MODEL, GEMINI_TIMEOUT_MS, logAndSanitizeAIError } = await import("@/lib/ai/gemini");
    const checkValidKey = typeof isValidApiKey === "function" ? isValidApiKey : (k?: string | null) => Boolean(k && k.length > 5 && !k.startsWith("AQ."));
    const rawApiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const hasAIConfig = checkValidKey(rawApiKey) || !!process.env.GOOGLE_CLOUD_PROJECT_ID;

    function getSimulatedResponse() {
      let simulatedAnswer = `Hey! I'd love to help you with that. Could you give me a bit more detail about what you're working on? For instance:\n\n1. **What subject or course** is this for?\n2. **What have you tried so far?**\n3. **Where exactly are you stuck?**\n\nThe more context you share, the better I can guide you! 😊`;

      if (enrichedQuery.toLowerCase().includes("math") || enrichedQuery.toLowerCase().includes("proof")) {
        simulatedAnswer = `Great, let's tackle this math problem together! To make sure we approach it the right way, can you tell me:\n\n1. What's the specific problem or theorem you're working on?\n2. What have you tried so far?\n3. Which step is tripping you up?\n\nOnce I know where you're at, we can work through it step-by-step!`;
      } else if (enrichedQuery.toLowerCase().includes("data structure") || enrichedQuery.toLowerCase().includes("algorithm")) {
        simulatedAnswer = `Ooh, Data Structures & Algorithms — one of my favorites! Let's work through it together.\n\nFirst question: when you think about this problem, what kind of operation matters most — speed of lookup, insertion, or memory usage? That'll help us figure out the best approach!`;
      } else if (attachments && attachments.length > 0) {
        simulatedAnswer = `Got your file (${attachments[0].name})! Let me help you work through it.\n\nWhat would you like to do with this material?\n\n1. **Summarize** the key concepts\n2. **Quiz me** on the content\n3. **Explain** a specific part in detail\n4. **Create flashcards** from it\n\nJust let me know!`;
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

    if (!hasAIConfig) {
      return getSimulatedResponse();
    }

    let ai;
    try {
      ai = getAIClient();
    } catch {
      return getSimulatedResponse();
    }

    // Separate the system message from user/assistant messages
    let customSystemInstruction = "";
    const filteredMessages = messages.filter((m: { role: string, content: string }) => {
      if (m.role === "system") {
        // Preserve any extra context (flashcards, resources) appended to system message
        customSystemInstruction = m.content;
        return false;
      }
      return true;
    });

    // Merge built-in persona prompt with any injected context (user's study materials)
    const contextSuffix = customSystemInstruction
      ? `\n\n## Student's Study Context\n${customSystemInstruction.replace(/^You are Kuya Nicolai[^]*?Context:\n/, "").trim()}`
      : "";
    const finalSystemInstruction = KUYA_NICOLAI_SYSTEM_PROMPT + contextSuffix;

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

    // Gemini requires alternating user/model turns — merge consecutive same-role messages
    const normalizedContents: typeof contents = [];
    for (const turn of contents) {
      const last = normalizedContents[normalizedContents.length - 1];
      if (last && last.role === turn.role) {
        // Merge parts into the previous turn
        last.parts = [...last.parts, ...turn.parts];
      } else {
        normalizedContents.push({ ...turn, parts: [...turn.parts] });
      }
    }

    // Gemini requires conversation to start with a user turn
    const firstUserIdx = normalizedContents.findIndex((c) => c.role === "user");
    const safeContents = firstUserIdx >= 0 ? normalizedContents.slice(firstUserIdx) : normalizedContents;

    try {
      const result = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: safeContents,
        config: {
          temperature: 0.85,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 2048,
          httpOptions: { timeout: GEMINI_TIMEOUT_MS },
          systemInstruction: finalSystemInstruction,
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
      const errStr = String(err);
      if (
        errStr.includes("PERMISSION_DENIED") ||
        errStr.includes("API key") ||
        errStr.includes("not valid") ||
        errStr.includes("403") ||
        errStr.includes("401") ||
        errStr.includes("RESOURCE_EXHAUSTED") ||
        errStr.includes("prepayment credits") ||
        errStr.includes("ACCESS_TOKEN_SCOPE")
      ) {
        return getSimulatedResponse();
      }

      const clientMsg = await Promise.resolve(logAndSanitizeAIError("Chat Endpoint", err));
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
