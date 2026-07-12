"use client";

import { useState, useRef, useEffect } from "react";
import {
  CreateWebWorkerMLCEngine,
  InitProgressReport,
  type MLCEngineInterface,
} from "@mlc-ai/web-llm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Bot, User, Send, Download, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

interface WebLLMChatProps {
  initialContext?: string;
}

// Use the WebWorker engine to offload ML computations from the main thread.
// We will create the worker from a separate file to ensure it bundles correctly.
export function WebLLMChat({ initialContext = "" }: WebLLMChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "system",
      content: `You are a helpful, encouraging AI tutor designed to help university students understand complex topics. Keep your answers concise, structured, and easy to read. Do not provide direct answers to homework or quizzes; instead, guide the student to the answer using the Socratic method.\n\n${initialContext}`,
    },
    {
      role: "assistant",
      content:
        "Hello! I am your personal AI Tutor. I run entirely locally in your browser so our conversation is private. What would you like to study today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [initProgress, setInitProgress] = useState<InitProgressReport | null>(
    null,
  );
  const [engine, setEngine] = useState<MLCEngineInterface | null>(null);
  const [isReady, setIsReady] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // We recommend using Llama-3.2-1B-Instruct-q4f16_1-MLC as it is fast and lightweight (under 1GB VRAM).
  const SELECTED_MODEL = "Llama-3.2-1B-Instruct-q4f16_1-MLC";

  useEffect(() => {
    // Scroll to bottom on new message
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function initializeEngine() {
    setIsLoading(true);
    try {
      const worker = new Worker(
        new URL("../lib/workers/webllm.worker.ts", import.meta.url),
        { type: "module" },
      );

      const newEngine = await CreateWebWorkerMLCEngine(worker, SELECTED_MODEL, {
        initProgressCallback: (progress) => {
          console.log(progress);
          setInitProgress(progress);
        },
      });
      setEngine(newEngine);
      setIsReady(true);
    } catch (error: unknown) {
      console.error("Failed to initialize WebLLM:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to download model",
      );
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, my systems failed to initialize. Your device might not support WebGPU, or there was a network error downloading the model.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !isReady || !engine || isLoading) return;

    const userMessage = input.trim();
    setInput("");

    const updatedMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage },
    ];

    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Add a placeholder for the assistant's response
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const chunks = await engine.chat.completions.create({
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
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="flex flex-col h-[700px] w-full max-w-4xl mx-auto shadow-lg border-primary/10">
      <CardHeader className="bg-muted/30 border-b pb-4">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          AI Tutor (On-Device)
        </CardTitle>
        <CardDescription>
          Powered by WebGPU and Llama 3. This AI runs 100% locally on your
          machine for ultimate privacy.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden relative">
        {!isReady && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-8 text-center">
            <Bot className="h-16 w-16 text-primary mb-4 animate-pulse" />
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
                      <Bot className="h-5 w-5" />
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
                  </div>
                </div>
              ))}
            {isLoading && isReady && (
              <div className="flex gap-3 mr-auto max-w-[85%] animate-pulse">
                <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-muted text-muted-foreground border">
                  <Bot className="h-5 w-5" />
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
