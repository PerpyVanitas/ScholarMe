"use client";

import { useState, useRef, useEffect } from "react";
import { useWebLLM } from "@/hooks/use-webllm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Send, Download, Loader2, CheckCheck } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

type Message = {
  role: "system" | "user" | "assistant";
  content: string;
  created_at?: string;
};

interface WebLLMChatProps {
  initialContext?: string;
  profileId?: string;
}

// Use the WebWorker engine to offload ML computations from the main thread.
// We will create the worker from a separate file to ensure it bundles correctly.
export function WebLLMChat({
  initialContext = "",
  profileId,
}: WebLLMChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "system",
      content: `You are Kuya Nicolai, the friendly, supportive, and knowledgeable mascot of the Honor Society. You act as an AI peer study buddy to university students. You are encouraging, use a friendly tone, and sometimes sprinkle in supportive phrases. Keep your answers concise, structured, and easy to read. Do not provide direct answers to homework or quizzes; instead, guide the student to the answer using the Socratic method.\n\nYou have access to the following resources and study materials that the user can currently access. If they ask about something related to these, you can help them recall it.\n\n${initialContext}`,
    },
    {
      role: "assistant",
      content:
        "Hello! I am Kuya Nicolai, your friendly peer study buddy from the Honor Society. I'm here to help you study and answer any questions you have about your materials. What would you like to focus on today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { engine, isLoading, isReady, initProgress, initializeEngine } =
    useWebLLM({
      workerUrl: new URL(
        "../../../lib/workers/webllm.worker.ts",
        import.meta.url,
      ),
    });

  useEffect(() => {
    // Scroll to bottom on new message
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, initProgress]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !isReady || !engine || isGenerating) return;

    const userMessage = input.trim();
    setInput("");

    setIsGenerating(true);
    let extraContext = "";

    try {
      if (profileId) {
        // Fetch context from RAG
        const searchRes = await fetch("/api/rag/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: userMessage, profileId }),
        });
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          if (searchData.chunks && searchData.chunks.length > 0) {
            extraContext =
              "\n\nRelevant information from the user's library resources:\n" +
              searchData.chunks.join("\n\n");
          }
        }
      }
    } catch (e) {
      console.error("Failed to fetch RAG context", e);
    }

    const updatedMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage + extraContext },
    ];

    const now = new Date().toISOString();
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage, created_at: now },
    ]);

    try {
      // Add a placeholder for the assistant's response
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "",
          created_at: new Date().toISOString(),
        },
      ]);

      const chunks = await (
        engine as unknown as {
          chat: {
            completions: {
              create: (
                req: unknown,
              ) => Promise<
                AsyncIterable<{ choices: { delta?: { content?: string } }[] }>
              >;
            };
          };
        }
      ).chat.completions.create({
        messages: updatedMessages,
        temperature: 0.7,
        stream: true,
      });

      let currentResponse = "";
      for await (const chunk of chunks) {
        const text = chunk.choices[0]?.delta?.content || "";
        currentResponse += text;

        // Update the last message (the assistant's placeholder)
        setMessages((prev) => {
          const newM = [...prev];
          newM[newM.length - 1].content = currentResponse;
          return newM;
        });
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast.error(error instanceof Error ? error.message : "An error occurred");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I encountered an error generating a response.",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Card className="flex flex-col h-[700px] w-full max-w-4xl mx-auto shadow-lg border-primary/10">
      <CardHeader className="bg-muted/30 border-b pb-4">
        <CardTitle className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/kuya-nicolai.png" alt="Kuya Nicolai" />
            <AvatarFallback>KN</AvatarFallback>
          </Avatar>
          Kuya Nicolai
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden relative">
        {!isReady && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-8 text-center">
            <Avatar className="h-20 w-20 mb-4 animate-pulse ring-4 ring-primary/20">
              <AvatarImage src="/kuya-nicolai.png" alt="Kuya Nicolai" />
              <AvatarFallback>KN</AvatarFallback>
            </Avatar>
            <h3 className="text-xl font-bold mb-2">Initialize Local AI</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              To chat privately, we need to download a small language model to
              your browser&apos;s cache (~1GB). This only happens once.
            </p>

            {initProgress ? (
              <div className="w-full max-w-md space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{initProgress.text}</span>
                </div>
                <Progress value={initProgress.progress * 100} className="h-2" />
              </div>
            ) : (
              <Button
                onClick={initializeEngine}
                disabled={isLoading}
                size="lg"
                className="gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Download className="h-5 w-5" />
                )}
                Download & Initialize Model
              </Button>
            )}
          </div>
        )}

        <ScrollArea ref={scrollRef} className="h-full p-6">
          <div className="flex flex-col gap-6">
            {messages
              .filter((m) => m.role !== "system")
              .map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-3 max-w-[85%] ${
                    msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  <div
                    className={`flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground border"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <User className="h-5 w-5" />
                    ) : (
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src="/kuya-nicolai.png"
                          alt="Kuya Nicolai"
                        />
                        <AvatarFallback>KN</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                  <div
                    className={`rounded-lg p-4 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted border shadow-sm"
                    }`}
                  >
                    <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                    {msg.created_at && (
                      <div
                        className={`flex items-center gap-1 mt-1 text-[9px] ${msg.role === "user" ? "text-primary-foreground/70 justify-end" : "text-muted-foreground justify-end"}`}
                      >
                        <span>
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {msg.role === "user" && (
                          <CheckCheck className="h-3 w-3 ml-0.5" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            {isLoading && isReady && (
              <div className="flex gap-3 mr-auto max-w-[85%] animate-pulse">
                <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-muted text-muted-foreground border">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/kuya-nicolai.png" alt="Kuya Nicolai" />
                    <AvatarFallback>KN</AvatarFallback>
                  </Avatar>
                </div>
                <div className="rounded-lg p-4 bg-muted border shadow-sm flex items-center gap-2">
                  <div
                    className="h-2 w-2 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="h-2 w-2 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="h-2 w-2 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-4 border-t bg-muted/30">
        <form onSubmit={handleSubmit} className="flex w-full gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isReady
                ? "Ask your tutor a question..."
                : "Initialize model first..."
            }
            disabled={!isReady || isLoading}
            className="flex-1"
            autoFocus
          />
          <Button
            type="submit"
            disabled={!isReady || isLoading || !input.trim()}
            size="icon"
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
