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
import { Badge } from "@/components/ui/badge";
import {
  User,
  Send,
  Download,
  Loader2,
  Paperclip,
  Sparkles,
  Zap,
  ShieldCheck,
  FileText,
  ImageIcon,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

type Message = {
  role: "system" | "user" | "assistant";
  content: string;
  created_at?: string;
  attachments?: { name: string; type: string; previewUrl?: string }[];
};

interface WebLLMChatProps {
  initialContext?: string;
  profileId?: string;
}

export function WebLLMChat({
  initialContext = "",
  profileId,
}: WebLLMChatProps) {
  // Mode: "server" (Instant Server AI) vs "local" (WebLLM in-browser cache)
  const [engineMode, setEngineMode] = useState<"server" | "local">("server");

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "system",
      content: `You are Kuya Nicolai, the friendly, supportive mascot of the Honor Society. You act as an AI peer study buddy. Guide the student using the Socratic method.\n\nContext:\n${initialContext}`,
    },
    {
      role: "assistant",
      content:
        "Hello! I am Kuya Nicolai, your peer study buddy from the Honor Society. Ask me anything, or upload a photo of your study material!",
    },
  ]);

  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { engine, isLoading, isReady, initProgress, initializeEngine } =
    useWebLLM({
      workerUrl: new URL(
        "../../../lib/workers/webllm.worker.ts",
        import.meta.url,
      ),
    });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isGenerating]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Attachment size must be under 10MB");
        return;
      }
      setAttachment(file);
      if (file.type.startsWith("image/")) {
        setAttachmentPreview(URL.createObjectURL(file));
      } else {
        setAttachmentPreview(null);
      }
    }
  };

  const clearAttachment = () => {
    setAttachment(null);
    setAttachmentPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  async function sendMessageContent(textToSend: string) {
    if ((!textToSend.trim() && !attachment) || isGenerating) return;

    const userText = textToSend.trim();
    const currentAttachment = attachment;
    const currentPreview = attachmentPreview;
    
    setInput("");
    clearAttachment();
    setIsGenerating(true);

    const now = new Date().toISOString();
    const attachmentsMeta = currentAttachment
      ? [
          {
            name: currentAttachment.name,
            type: currentAttachment.type,
            previewUrl: currentPreview || undefined,
          },
        ]
      : undefined;

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userText || `[Uploaded file: ${currentAttachment?.name}]`,
        created_at: now,
        attachments: attachmentsMeta,
      },
    ]);

    let attachmentTextContent = "";
    if (currentAttachment && !currentAttachment.type.startsWith("image/")) {
      try {
        attachmentTextContent = await currentAttachment.text();
      } catch {
        attachmentTextContent = `File: ${currentAttachment.name}`;
      }
    }

    try {
      // Server AI Mode Execution (Instant & Responsive)
      if (engineMode === "server") {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "",
            created_at: new Date().toISOString(),
          },
        ]);

        const reqBody = {
          messages: messages.concat([{ role: "user", content: userText }]),
          attachments: currentAttachment
            ? [{ name: currentAttachment.name, type: currentAttachment.type, content: attachmentTextContent }]
            : undefined,
        };

        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reqBody),
        });

        if (!response.ok) {
          throw new Error(`Server AI Error (${response.status})`);
        }

        const data = await response.json();
        const replyText = data.choices?.[0]?.message?.content || "No response generated.";

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1].content = replyText;
          return updated;
        });
      } else {
        // Local WebLLM Execution
        if (!isReady || !engine) {
          toast.error("Local engine not initialized yet. Download model first or switch to Server AI.");
          setIsGenerating(false);
          return;
        }

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "",
            created_at: new Date().toISOString(),
          },
        ]);

        const updatedMessages: Message[] = [
          ...messages,
          { role: "user", content: userText },
        ];

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
          setMessages((prev) => {
            const newM = [...prev];
            newM[newM.length - 1].content = currentResponse;
            return newM;
          });
        }
      }
    } catch (err: unknown) {
      console.error("AI Chat Error:", err);
      toast.error("Failed to generate AI response");
    } finally {
      setIsGenerating(false);
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessageContent(input);
  };

  const presetPrompts = [
    "💡 Socratic Math Guidance",
    "📝 Quiz Me on Data Structures",
    "📷 Review My Study Notes",
    "⚡ Honor Society Exam Prep",
  ];

  return (
    <Card className="flex flex-col h-[720px] w-full max-w-4xl mx-auto shadow-lg border-primary/20">
      <CardHeader className="bg-card border-b p-4 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <Avatar className="h-9 w-9 ring-2 ring-primary/20">
            <AvatarImage src="/kuya-nicolai.png" alt="Kuya Nicolai" />
            <AvatarFallback>KN</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-bold flex items-center gap-2">
              Kuya Nicolai AI
              <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                {engineMode === "server" ? "Instant Server AI" : "Local WebLLM"}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground font-normal">
              CIT-U Honor Society Socratic Peer Study Buddy
            </p>
          </div>
        </CardTitle>

        {/* Engine Mode Selector */}
        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border text-xs">
          <Button
            type="button"
            size="sm"
            variant={engineMode === "server" ? "default" : "ghost"}
            className="h-7 text-[11px] gap-1 px-2.5"
            onClick={() => setEngineMode("server")}
          >
            <Zap className="h-3 w-3" /> Fast Server AI
          </Button>
          <Button
            type="button"
            size="sm"
            variant={engineMode === "local" ? "default" : "ghost"}
            className="h-7 text-[11px] gap-1 px-2.5"
            onClick={() => setEngineMode("local")}
          >
            <ShieldCheck className="h-3 w-3" /> Private Local
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden relative bg-muted/10">
        {/* Local Engine Download Overlay if local mode chosen & not ready */}
        {engineMode === "local" && !isReady && (
          <div className="absolute inset-0 bg-background/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-8 text-center">
            <Avatar className="h-16 w-16 mb-3 animate-pulse ring-4 ring-primary/20">
              <AvatarImage src="/kuya-nicolai.png" alt="Kuya Nicolai" />
              <AvatarFallback>KN</AvatarFallback>
            </Avatar>
            <h3 className="text-lg font-bold mb-1">Initialize Local WebLLM Engine</h3>
            <p className="text-muted-foreground text-xs mb-4 max-w-md">
              Download small in-browser LLM weights (~1GB) for 100% offline private processing.
            </p>
            {initProgress ? (
              <div className="w-full max-w-md space-y-2">
                <Progress value={initProgress.progress * 100} className="h-2" />
                <p className="text-[11px] text-muted-foreground">{initProgress.text}</p>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button onClick={initializeEngine} disabled={isLoading} size="sm" className="gap-2 text-xs">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Download Local Model
                </Button>
                <Button onClick={() => setEngineMode("server")} variant="outline" size="sm" className="text-xs">
                  Switch to Fast Server AI
                </Button>
              </div>
            )}
          </div>
        )}

        <ScrollArea ref={scrollRef} className="h-full p-6">
          <div className="flex flex-col gap-5">
            {messages
              .filter((m) => m.role !== "system")
              .map((msg, index) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={index}
                    className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                      {isUser ? (
                        <>
                          <AvatarImage src="" />
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">U</AvatarFallback>
                        </>
                      ) : (
                        <>
                          <AvatarImage src="/kuya-nicolai.png" alt="Kuya Nicolai" />
                          <AvatarFallback>KN</AvatarFallback>
                        </>
                      )}
                    </Avatar>

                    <div
                      className={`flex flex-col gap-1.5 max-w-[80%] rounded-xl p-4 text-xs shadow-sm ${
                        isUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-card border text-card-foreground"
                      }`}
                    >
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="space-y-1 pb-1">
                          {msg.attachments.map((att, i) => (
                            <div key={i} className="flex items-center gap-2 p-1.5 rounded bg-background/20 text-[11px]">
                              {att.previewUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={att.previewUrl} alt={att.name} className="h-10 w-10 object-cover rounded border" />
                              ) : (
                                <FileText className="h-4 w-4" />
                              )}
                              <span className="truncate">{att.name}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {msg.content ? (
                        <div className="prose dark:prose-invert text-xs leading-relaxed max-w-none">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground py-1">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking...
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Preset Quick Prompts */}
      <div className="px-4 py-2 border-t bg-card/60 flex items-center gap-2 overflow-x-auto text-xs">
        <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
        {presetPrompts.map((p, i) => (
          <Button
            key={i}
            type="button"
            variant="outline"
            size="sm"
            className="h-6 text-[11px] shrink-0 rounded-full px-2.5 hover:bg-primary/10"
            onClick={() => sendMessageContent(p.slice(2))}
          >
            {p}
          </Button>
        ))}
      </div>

      <CardFooter className="p-3 border-t bg-card flex flex-col gap-2">
        {/* Attachment preview bar */}
        {attachment && (
          <div className="w-full flex items-center justify-between p-2 rounded border bg-muted/40 text-xs">
            <div className="flex items-center gap-2">
              {attachmentPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={attachmentPreview} alt="preview" className="h-8 w-8 object-cover rounded border" />
              ) : (
                <FileText className="h-4 w-4 text-primary" />
              )}
              <span className="truncate font-medium">{attachment.name}</span>
            </div>
            <Button type="button" variant="ghost" size="icon" className="h-5 w-5" onClick={clearAttachment}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,.pdf,.txt,.js,.ts,.py,.doc,.docx"
          />

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => fileInputRef.current?.click()}
            title="Attach photo or file"
          >
            <Paperclip className="h-4 w-4 text-muted-foreground" />
          </Button>

          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Kuya Nicolai or upload study materials..."
            className="flex-1 text-xs h-9"
            disabled={isGenerating}
          />

          <Button type="submit" size="sm" className="h-9 gap-1.5 shrink-0" disabled={isGenerating || (!input.trim() && !attachment)}>
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
