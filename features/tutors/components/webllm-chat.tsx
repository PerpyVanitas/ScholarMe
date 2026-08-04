"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useWebLLM } from "@/hooks/use-webllm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Send,
  Download,
  Loader2,
  Paperclip,
  ShieldCheck,
  FileText,
  X,
  Zap,
  Globe,
  History,
  Plus,
  Trash2,
  MessageSquare,
  Clock,
  Sparkles,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

export type Message = {
  role: "system" | "user" | "assistant";
  content: string;
  created_at?: string;
  attachments?: { name: string; type: string; previewUrl?: string }[];
};

export type ChatSession = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
};

function generateSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `session_${crypto.randomUUID()}`;
  }
  // eslint-disable-next-line react-hooks/purity
  return `session_${Date.now()}`;
}

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
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const getDefaultMessages = useCallback((): Message[] => [
    {
      role: "system",
      content: initialContext ? `Context:\n${initialContext}` : "",
    },
    {
      role: "assistant",
      content:
        "Hey! I'm Nicolai, your peer study buddy from the Honor Society. Ask me anything — whether it's a tricky concept, a homework problem, or you just want to quiz yourself. You can also upload a photo of your notes or study material!",
    },
  ], [initialContext]);

  const [messages, setMessages] = useState<Message[]>(getDefaultMessages());

  // Load sessions & engine mode from localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem("scholarme_ai_mode");
    if (savedMode === "local" || savedMode === "server") {
      setEngineMode(savedMode);
    }

    const savedSessions = localStorage.getItem("scholarme_ai_sessions");
    if (savedSessions) {
      try {
        const parsed: ChatSession[] = JSON.parse(savedSessions);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          setActiveSessionId(parsed[0].id);
          setMessages(parsed[0].messages);
        }
      } catch (e) {
        console.error("Error parsing saved sessions:", e);
      }
    }
  }, [getDefaultMessages]);

  // Persist sessions to localStorage
  const saveSessionsToStorage = (updatedSessions: ChatSession[]) => {
    setSessions(updatedSessions);
    try {
      localStorage.setItem("scholarme_ai_sessions", JSON.stringify(updatedSessions));
    } catch (e) {
      console.error("Error saving sessions:", e);
    }
  };

  const startNewChat = () => {
    const newId = generateSessionId();
    const initialMsgs = getDefaultMessages();
    const newSession: ChatSession = {
      id: newId,
      title: "New Conversation",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: initialMsgs,
    };
    const updated = [newSession, ...sessions];
    saveSessionsToStorage(updated);
    setActiveSessionId(newId);
    setMessages(initialMsgs);
    setHistoryOpen(false);
    toast.success("Started a new conversation thread");
  };

  const selectSession = (sessionId: string) => {
    const target = sessions.find((s) => s.id === sessionId);
    if (target) {
      setActiveSessionId(sessionId);
      setMessages(target.messages);
      setHistoryOpen(false);
    }
  };

  const deleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter((s) => s.id !== sessionId);
    saveSessionsToStorage(updated);
    if (activeSessionId === sessionId) {
      if (updated.length > 0) {
        setActiveSessionId(updated[0].id);
        setMessages(updated[0].messages);
      } else {
        startNewChat();
      }
    }
    toast.success("Deleted conversation thread");
  };

  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const isGeneratingRef = useRef(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { engine, isLoading, isReady, initProgress } =
    useWebLLM({
      workerUrl: new URL(
        "../../../lib/workers/webllm.worker.ts",
        import.meta.url,
      ),
    });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  // Sync current active session messages into session list
  const syncCurrentMessagesToSessions = useCallback((updatedMessages: Message[]) => {
    if (!activeSessionId) {
      const newId = generateSessionId();
      const firstUserMsg = updatedMessages.find((m) => m.role === "user")?.content || "New Conversation";
      const title = firstUserMsg.slice(0, 36) + (firstUserMsg.length > 36 ? "..." : "");
      const newSession: ChatSession = {
        id: newId,
        title,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: updatedMessages,
      };
      setActiveSessionId(newId);
      saveSessionsToStorage([newSession, ...sessions]);
      return;
    }

    const firstUserMsg = updatedMessages.find((m) => m.role === "user")?.content;
    const title = firstUserMsg
      ? firstUserMsg.slice(0, 36) + (firstUserMsg.length > 36 ? "..." : "")
      : "Conversation";

    const updated = sessions.map((s) => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          title: s.title === "New Conversation" ? title : s.title,
          updatedAt: new Date().toISOString(),
          messages: updatedMessages,
        };
      }
      return s;
    });

    saveSessionsToStorage(updated);
  }, [activeSessionId, sessions]);

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

    const userMessage: Message = {
      role: "user",
      content: userText || `[Uploaded file: ${currentAttachment?.name}]`,
      created_at: now,
      attachments: attachmentsMeta,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

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
        const assistantPlaceholder: Message = {
          role: "assistant",
          content: "",
          created_at: new Date().toISOString(),
        };

        const updatedWithPlaceholder = [...newMessages, assistantPlaceholder];
        setMessages(updatedWithPlaceholder);

        const reqBody = {
          messages: newMessages,
          attachments: currentAttachment
            ? [
                {
                  name: currentAttachment.name,
                  type: currentAttachment.type,
                  content: attachmentTextContent,
                  base64: base64ImageContent || undefined,
                },
              ]
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
          replyText =
            errData?.error ||
            errData?.message ||
            `AI service temporarily unavailable (${response.status}). Please try again.`;
        } else {
          const data = await response.json();
          replyText =
            data.choices?.[0]?.message?.content || "No response generated.";
        }

        setMessages((prev) => {
          const finalState = [...prev];
          finalState[finalState.length - 1].content = replyText;
          syncCurrentMessagesToSessions(finalState);
          return finalState;
        });
      } else {
        // Local WebLLM
        if (!isReady || !engine) {
          toast.error(
            "Local engine not ready. Download it first or switch to Server AI in Settings."
          );
          setIsGenerating(false);
          return;
        }

        const assistantPlaceholder: Message = {
          role: "assistant",
          content: "",
          created_at: new Date().toISOString(),
        };
        const updatedWithPlaceholder = [...newMessages, assistantPlaceholder];
        setMessages(updatedWithPlaceholder);

        const chunks = await (
          engine as unknown as {
            chat: {
              completions: {
                create: (
                  req: unknown
                ) => Promise<
                  AsyncIterable<{ choices: { delta?: { content?: string } }[] }>
                >;
              };
            };
          }
        ).chat.completions.create({
          messages: newMessages,
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
            syncCurrentMessagesToSessions(newM);
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

  const activeSessionObj = sessions.find((s) => s.id === activeSessionId);

  return (
    <div className="w-full space-y-4">
      {/* ─── Top Session Action Bar (Under AI Tutor Label) ─── */}
      <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-card border border-border/60 shadow-sm flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <Badge variant="outline" className="text-xs gap-1.5 px-3 py-1 bg-muted/40">
            <MessageSquare className="h-3.5 w-3.5 text-primary" />
            <span className="font-semibold truncate max-w-[200px] sm:max-w-[300px]">
              {activeSessionObj ? activeSessionObj.title : "Active Conversation"}
            </span>
          </Badge>
          <Badge variant="secondary" className="text-[10px] hidden sm:inline-flex">
            {sessions.length} Saved {sessions.length === 1 ? "Session" : "Sessions"}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Chat History Sheet Trigger */}
          <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-semibold">
                <History className="h-3.5 w-3.5 text-primary" />
                <span>Chat History</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[340px] sm:w-[400px] p-0 flex flex-col">
              <SheetHeader className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-base font-bold flex items-center gap-2">
                    <History className="h-4 w-4 text-primary" />
                    <span>Past Conversations</span>
                  </SheetTitle>
                  <Button
                    size="sm"
                    variant="default"
                    className="h-7 text-xs gap-1"
                    onClick={startNewChat}
                  >
                    <Plus className="h-3.5 w-3.5" /> New Chat
                  </Button>
                </div>
              </SheetHeader>

              <ScrollArea className="flex-1 p-3">
                {sessions.length === 0 ? (
                  <div className="text-center py-12 space-y-2 text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mx-auto opacity-40" />
                    <p className="text-sm font-medium">No past conversations yet</p>
                    <p className="text-xs">Start asking Kuya Nicolai questions to build your history!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sessions.map((session) => {
                      const isActive = session.id === activeSessionId;
                      const msgCount = session.messages.filter((m) => m.role !== "system").length;
                      return (
                        <div
                          key={session.id}
                          onClick={() => selectSession(session.id)}
                          className={`p-3 rounded-lg border text-left transition-all duration-200 cursor-pointer group flex items-center justify-between gap-3 ${
                            isActive
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border/60 hover:border-primary/40 bg-card hover:bg-accent/40"
                          }`}
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-foreground truncate">
                                {session.title}
                              </span>
                              {isActive && (
                                <Badge variant="default" className="text-[9px] px-1.5 py-0 h-4">
                                  Active
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(session.updatedAt).toLocaleDateString([], {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              <span>•</span>
                              <span>{msgCount} messages</span>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => deleteSession(session.id, e)}
                            aria-label="Delete chat session"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </SheetContent>
          </Sheet>

          <Button size="sm" variant="default" className="h-8 gap-1.5 text-xs font-semibold" onClick={startNewChat}>
            <Plus className="h-3.5 w-3.5" />
            <span>New Chat</span>
          </Button>
        </div>
      </div>

      {/* ─── Main Chat Card ─── */}
      <Card className="flex flex-col h-[680px] w-full max-w-3xl mx-auto shadow-md border-border/60">
        {/* ─── Card Header ─── */}
        <div className="flex items-center gap-3 px-4 py-3 border-b bg-card">
          <Avatar className="h-9 w-9 ring-2 ring-primary/20 shrink-0">
            <AvatarImage src="/kuya-nicolai.png" alt="Kuya Nicolai" />
            <AvatarFallback>KN</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm leading-none">Kuya Nicolai</p>
              <Badge variant="outline" className="text-[10px] gap-1 px-1.5 py-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                <Globe className="h-2.5 w-2.5" />
                Web Search Active
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {engineMode === "local" ? (
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-emerald-500" />
                  Private Local Engine
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-primary" />
                  Server AI Engine
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

        {/* ─── Message List ─── */}
        <CardContent className="flex-1 p-4 overflow-hidden">
          <ScrollArea className="h-full pr-4">
            <div className="space-y-4">
              {messages
                .filter((m) => m.role !== "system")
                .map((msg, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 ${
                      msg.role === "user" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src="/kuya-nicolai.png" alt="Kuya Nicolai" />
                        <AvatarFallback>KN</AvatarFallback>
                      </Avatar>
                    ) : (
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
                          U
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm space-y-2 shadow-sm ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-muted/80 border border-border/50 text-foreground rounded-tl-none"
                      }`}
                    >
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="space-y-2 mb-2">
                          {msg.attachments.map((att, attIdx) => (
                            <div key={attIdx} className="rounded-lg overflow-hidden border border-white/20 bg-black/20 p-2">
                              {att.previewUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={att.previewUrl}
                                  alt={att.name}
                                  className="max-h-48 rounded object-cover"
                                />
                              ) : (
                                <div className="flex items-center gap-2 text-xs">
                                  <FileText className="h-4 w-4" />
                                  <span className="font-semibold truncate">{att.name}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {msg.content ? (
                        <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs opacity-70">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Nicolai is thinking...</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </CardContent>

        {/* ─── Input Form ─── */}
        <CardFooter className="p-3 border-t bg-card">
          <form onSubmit={handleSubmit} className="w-full space-y-2">
            {attachment && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/60 text-xs border">
                {attachmentPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={attachmentPreview} alt="Preview" className="h-8 w-8 object-cover rounded" />
                ) : (
                  <FileText className="h-4 w-4 text-primary" />
                )}
                <span className="truncate flex-1 font-medium">{attachment.name}</span>
                <Button variant="ghost" size="icon" type="button" onClick={clearAttachment} className="h-6 w-6">
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                accept="image/*,application/pdf,text/plain"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="h-10 w-10 shrink-0"
                title="Attach photo or notes"
              >
                <Paperclip className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message Kuya Nicolai..."
                className="flex-1 h-10 text-sm"
                disabled={isGenerating}
              />
              <Button
                type="submit"
                disabled={(!input.trim() && !attachment) || isGenerating}
                size="icon"
                className="h-10 w-10 shrink-0"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
