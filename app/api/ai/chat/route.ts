import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

// Rate limit for server-side AI fallback (stricter than other endpoints to prevent abuse)
const aiRateLimiter = rateLimit({ interval: 60 * 1000, limit: 10 }); // 10 requests per minute

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Rate limiting based on user ID
    const rateLimitResult = await aiRateLimiter.check(`ai_${user.id}`);
    if (!rateLimitResult.success) {
      return new NextResponse("Too many requests", { status: 429 });
    }

    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return new NextResponse("Invalid request: messages array is required", { status: 400 });
    }

    // This is a placeholder for the actual AI API call (e.g., Groq, Gemini, OpenAI)
    // We'll use a mocked response if API keys aren't present to prevent CI crashes
    const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.warn("No AI API key configured. Using mock response for server-side AI fallback.");
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return NextResponse.json({
        choices: [
          {
            message: {
              role: "assistant",
              content: "This is a simulated server-side response because your device does not support WebGPU, and no server-side API key was configured in the environment variables."
            }
          }
        ]
      });
    }

    // Example implementation using Groq (OpenAI-compatible endpoint)
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3-8b-8192", // Fast, standard model
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024,
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("AI API Error:", errorData);
      return new NextResponse("Failed to communicate with AI provider", { status: 502 });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("Server-side AI Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
