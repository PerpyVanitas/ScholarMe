"use client";

import { useState, useRef, useEffect } from "react";
import { useWebLLM } from "@/hooks/use-webllm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Send,
  Download,
  Loader2,
  Paperclip,
  ShieldCheck,
  FileText,
  X,
  Zap,
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
  // Read engine mode from localStorage (set by Settings page)
  const [engineMode, setEngineMode] = useState<"server" | "local">("server");

  useEffect(() => {
    const saved = localStorage.getItem("scholarme_ai_mode");
    if (saved === "local" || saved === "server") {
      setEngineMode(saved);
    }
  }, []);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "system",
      // Only pass study context — the full persona & behavior lives in the server route
      content: initialContext ? `Context:\n${initialContext}` : "",
    },
    {
      role: "assistant",
      content:
        "Hey! I'm Nicolai, your peer study buddy from the Honor Society. Ask me anything — whether it's a tricky concept, a homework problem, or you just want to quiz yourself. You can also upload a photo of your notes or study material!",
    },
  ]);

  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const isGeneratingRef = useRef(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { engine, isLoading, isReady, initProgress, initializeEngine } =
    useWebLLM({
      workerUrl: new URL(
        "../../../lib/workers/webllm.worker.ts",
        import.meta.url,
      ),
    });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  // Suppress unused var
  void profileId;

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

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
    if ((!textToSend.trim() && !attachment) || isGeneratingRef.current) return;

    const userText = textToSend.trim();
    const currentAttachment = attachment;
    const currentPreview = attachmentPreview;

    setInput("");
    clearAttachment();
    setIsGenerating(true);
    isGeneratingRef.current = true;

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
    let base64ImageContent = "";
    if (currentAttachment) {
      if (currentAttachment.type.startsWith("image/")) {
        try {
          base64ImageContent = await fileToBase64(currentAttachment);
        } catch {
          // ignore
        }
      } else {
        try {
          attachmentTextContent = await currentAttachment.text();
        } catch {
          attachmentTextContent = `File: ${currentAttachment.name}`;
        }
      }
    }

    try {
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
            ? [{
                name: currentAttachment.name,
                type: currentAttachment.type,
                content: attachmentTextContent,
                base64: base64ImageContent || undefined
              }]
            : undefined,
        };

        const response = await fetch("/api/v1/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reqBody),
        });

        let replyText = "";
        if (!response.ok) {
          const errData = await response.json().catch(() => null);
          replyText = errData?.error || errData?.message || `AI service temporarily unavailable (${response.status}). Please try again.`;
        } else {
          const data = await response.json();
          replyText = data.choices?.[0]?.message?.content || "No response generated.";
        }

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1].content = replyText;
          return updated;
        });
      } else {
        // Local WebLLM
        if (!isReady || !engine) {
          toast.error("Local engine not ready. Download it first or switch to Server AI in Settings.");
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
          temperature: 0.85,
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
      toast.error("Failed to generate AI response");
      console.error("AI Chat Error:", err);
    } finally {
      setIsGenerating(false);
      isGeneratingRef.current = false;
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessageContent(input);
  };

  return (
    <Card className="flex flex-col h-[720px] w-full max-w-3xl mx-auto shadow-md border-border/60">
      {/* ─── Header ─── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-card">
        <Avatar className="h-9 w-9 ring-2 ring-primary/20 shrink-0">
          <AvatarImage src="/kuya-nicolai.png" alt="Kuya Nicolai" />
          <AvatarFallback>KN</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-none">Kuya Nicolai</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {engineMode === "local" ? (
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                Private Local
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-primary" />
                Server AI
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ─── Local model download progress bar ─── */}
      {engineMode === "local" && isLoading && initProgress && (
        <div className="px-4 py-2 border-b bg-muted/20 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
              Downloading local model...
            </span>
            <span className="font-medium text-primary tabular-nums">
              {Math.round(initProgress.progress * 100)}%
            </span>
          </div>
          <Progress value={initProgress.progress * 100} className="h-1.5" />
          <p className="text-[10px] text-muted-foreground truncate">{initProgress.text}</p>
        </div>
      )}

      {/* ─── Local model ready banner ─── */}
      {engineMode === "local" && isReady && (
        <div className="px-4 py-1.5 border-b bg-emerald-500/10 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="h-3 w-3" />
          Local model ready — 100% private & offline
        </div>
      )}

      {/* ─── Message area ─── */}
      <CardContent className="flex-1 p-0 overflow-hidden relative bg-muted/10">
        {/* Local Engine Download Overlay */}
        {engineMode === "local" && !isReady && (
          <div className="absolute inset-0 bg-background/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-8 text-center">
            <Avatar className="h-16 w-16 mb-3 animate-pulse ring-4 ring-primary/20">
              <AvatarImage src="/kuya-nicolai.png" alt="Kuya Nicolai" />
              <AvatarFallback>KN</AvatarFallback>
            </Avatar>
            <h3 className="text-lg font-bold mb-1">Initialize Local Model</h3>
            <p className="text-muted-foreground text-xs mb-4 max-w-md">
              Download model weights (~1GB) for 100% offline private processing.
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
              </div>
            )}
          </div>
        )}

        <ScrollArea className="h-full p-5">
          <div className="flex flex-col gap-4">
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
                      className={`flex flex-col gap-1.5 max-w-[78%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                        isUser
                          ? "bg-primary text-primary-foreground [&_.prose]:text-inherit rounded-tr-sm"
                          : "bg-card border text-card-foreground rounded-tl-sm"
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
                        <div className="prose dark:prose-invert text-sm leading-relaxed max-w-none">
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
          <div ref={messagesEndRef} />
        </ScrollArea>
      </CardContent>

      {/* ─── Input footer ─── */}
      <CardFooter className="p-3 border-t bg-card flex flex-col gap-2">
        {/* Attachment preview */}
        {attachment && (
          <div className="w-full flex items-center justify-between p-2 rounded-lg border bg-muted/40 text-xs">
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
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => fileInputRef.current?.click()}
            title="Attach photo or file"
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message Kuya Nicolai..."
            className="flex-1 text-sm h-9 rounded-full bg-muted/40 border-muted focus-visible:ring-primary/30"
            disabled={isGenerating || (engineMode === "local" && !isReady)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessageContent(input);
              }
            }}
          />

          <Button
            type="submit"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-full"
            disabled={isGenerating || (!input.trim() && !attachment) || (engineMode === "local" && !isReady)}
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
