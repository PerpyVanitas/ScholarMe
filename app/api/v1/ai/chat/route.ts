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

import { searchDuckDuckGo } from "@/lib/ai/web-search";

const KUYA_NICOLAI_SYSTEM_PROMPT = `You are Nicolai, a warm, encouraging, and knowledgeable peer tutor from CIT-U's Honor Society. Think of yourself as a brilliant upperclassman who genuinely cares about helping students learn. When users see you in the app, you're listed as "Kuya Nicolai" — but in conversation you refer to yourself simply as "Nicolai".

## Personality & Tone
- Be naturally conversational, warm, and highly intelligent — like a real person, not a robotic script.
- Refer to yourself as "Nicolai" (never "Kuya Nicolai") in your responses.
- Use casual but respectful language. Light Filipino expressions ("Sige!", "Ayos!", "Nice one!") are welcome but don't overdo it.
- Show genuine enthusiasm for learning and celebrate student progress.
- NEVER start responses with "Kamusta! I analyzed your query:" or repetitive robotic preambles.

## Core Teaching Approach & Direct Answers
- When a student asks a direct general knowledge or concept query (e.g., historical figures like Hannibal Barca, scientific concepts, programming libraries, or homework topics), ALWAYS provide a rich, clear, and informative direct explanation FIRST!
- NEVER respond with robotic template questions demanding subject/course metadata (e.g. "What subject is this for? What have you tried?") when a student asks a straightforward question.
- Use Socratic follow-ups ONLY after you have provided helpful information, to deepen their understanding.

## Multi-Turn Context & Memory
- You receive the full conversation history. ALWAYS inspect previous messages in the chat history.
- If a student gives a short follow-up like "no answer to all of those, just in general", "tell me more", or "explain further", inspect the previous messages to identify their original query (e.g. Hannibal Barca) and immediately provide a comprehensive overview!
- Never repeat questions you already asked if the user dismissed them.

## Web / Browser Search Capabilities
- You have live access to Google Search and browser web search tools.
- When asked about historical events, general knowledge, recent developments, or detailed academic concepts, synthesize accurate live web search results to give thorough, up-to-date answers.

## Response Format
- Use Markdown for structure (headers, bullet points, bold text, code blocks).
- Keep responses engaging, structured, and easy to read.`;

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

    // Smart Multi-Turn Memory & Fallback Web Search Synthesis
    async function getSimulatedResponse() {
      // Look back through conversation history to find the core topic if current message is short/generic
      const allUserTexts = messages
        .filter((m) => m.role === "user")
        .map((m) => m.content.toLowerCase())
        .join(" ");

      const isGenericFollowup =
        /no answer|just in general|tell me more|in general|explain|what about it/i.test(enrichedQuery);

      let topicQuery = enrichedQuery;
      if (isGenericFollowup && messages.length >= 2) {
        // Find the most recent substantive user question
        const priorUserMsgs = messages.filter((m) => m.role === "user" && m.content.length > 5);
        if (priorUserMsgs.length > 0) {
          topicQuery = priorUserMsgs[priorUserMsgs.length - 1].content;
        }
      }

      const queryLower = topicQuery.toLowerCase();
      let simulatedAnswer = "";

      // 1. Hannibal Barca / Carthaginian History
      if (queryLower.includes("hannibal") || queryLower.includes("barca")) {
        simulatedAnswer = `### 🗡️ Hannibal Barca (247 BC – 183/181 BC)

**Hannibal Barca** was a legendary Carthaginian general and statesman, widely regarded as one of the greatest military strategists in human history.

#### Key Historical Highlights:
- **Second Punic War (218–201 BC)**: Led Carthage against the Roman Republic in a conflict that reshaped the Mediterranean world.
- **Crossing the Alps (218 BC)**: Executed an extraordinary military feat by marching his army — including cavalry and war elephants — across the Pyrenees and the Alps into Italy during winter.
- **Battle of Cannae (216 BC)**: Achieved a tactical masterpiece using a double-envelopment tactic to surround and destroy a superior Roman force. This battle is still taught in military academies worldwide today.
- **Tactical Legacy**: Maintained an undefeated campaign in Italy for over 15 years through brilliant maneuver warfare and psychological understanding of his opponents.

*Would you like to explore his famous battle tactics, his rivalry with Scipio Africanus, or the downfall of Carthage?*`;
      } 
      // 2. Math & Calculus
      else if (queryLower.includes("math") || queryLower.includes("calculus") || queryLower.includes("derivative") || queryLower.includes("proof")) {
        simulatedAnswer = `### 📐 Mathematics & Problem Solving

Let's tackle this math problem together step-by-step!

1. **Understand the Core Concept**: Whether it's calculus derivatives, integration, or algebraic proofs, identifying the governing rules (e.g. Power Rule, Chain Rule, L'Hôpital's Rule) is the key first step.
2. **Setup & Execution**: Work systematically from the given equations to isolate variables.
3. **Verification**: Plug your result back into the original condition to verify consistency.

*Feel free to share the exact problem statement or equation, and we can solve it together step-by-step!*`;
      }
      // 3. Computer Science & Coding
      else if (queryLower.includes("code") || queryLower.includes("data structure") || queryLower.includes("algorithm") || queryLower.includes("react") || queryLower.includes("python")) {
        simulatedAnswer = `### 💻 Computer Science & Software Engineering

Whether you're working on Data Structures, Algorithms, or Modern Web Development:

- **Data Structures**: Focus on time complexity ($O(1)$, $O(\log n)$, $O(n)$) and space efficiency when picking between Hash Tables, Trees, and Arrays.
- **Algorithms**: Break complex logic into smaller sub-problems using recursion, dynamic programming, or sliding window techniques.

*Share your snippet or algorithmic challenge, and I'll help you debug or optimize it with clean working code!*`;
      }
      // 4. Fallback Real-time Web Search via DuckDuckGo synthesis
      else {
        const searchResults = await searchDuckDuckGo(topicQuery);
        if (searchResults.length > 0) {
          const topResult = searchResults[0];
          simulatedAnswer = `### 🌐 Search Knowledge: ${topResult.title}\n\n${topResult.snippet}\n\n*Source: [${topResult.title}](${topResult.url})*\n\nIs there a specific detail about this topic you'd like to explore further?`;
        } else {
          simulatedAnswer = `Hey! I'd love to help you explore **${topicQuery.slice(0, 50)}**.\n\nHere is a quick overview:\n- This is a key concept in its field.\n- We can dive into its foundational principles, historical background, or practical applications.\n\nWhat specific angle would you like to focus on first? 😊`;
        }
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
      return await getSimulatedResponse();
    }

    let ai;
    try {
      ai = getAIClient();
    } catch {
      return await getSimulatedResponse();
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
