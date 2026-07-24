"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { apiClient } from "@/lib/api-client";
import { useRealtimeMessages } from "@/features/messaging/hooks/use-realtime-messages";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarUrl } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  MessageSquare,
  Search,
  Plus,
  Loader2,
  ArrowLeft,
  Paperclip,
  X,
  FileIcon,
  Download,
  ShieldAlert,
  Upload,
  Sparkles,
  Pin,
  Reply,
  CheckCheck,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type {
  Conversation,
  ConversationMessage,
  Message,
  Profile,
} from "@/lib/types";
import { ChatSidebar } from "./chat-sidebar";
import { ChatMessageBubble } from "./chat-message-bubble";
import { ChatInputArea } from "./chat-input-area";

interface ChatInterfaceProps {
  initialConversations?: Conversation[];
  currentUserId?: string;
  isAdmin?: boolean;
  forceAuditMode?: boolean;
  defaultActiveConversationId?: string;
}

export function ChatInterface({
  initialConversations = [],
  currentUserId,
  isAdmin = false,
  forceAuditMode = false,
  defaultActiveConversationId,
}: ChatInterfaceProps) {
  const [supabase] = useState(() => createClient());
  const [conversations, setConversations] =
    useState<Conversation[]>(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(
    defaultActiveConversationId ||
      (initialConversations.length > 0 ? initialConversations[0].id : null),
  );

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId,
  );

  const currentParticipant =
    activeConversation?.conversation_participants?.find(
      (p) => p.profile_id === currentUserId,
    );
  const currentUserName = currentParticipant?.profiles?.full_name || "Someone";

  const {
    messages,
    sendMessage,
    typingUsers,
    sendTypingEvent,
    pinMessage,
    markAsRead,
  } = useRealtimeMessages(activeConversationId, currentUserId, currentUserName);
  const [newMessage, setNewMessage] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Chat States
  const [users, setUsers] = useState<Profile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [conversationSearch, setConversationSearch] = useState("");
  const [messageSearch, setMessageSearch] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  useEffect(() => {
    if (
      messages.length > 0 &&
      messages[messages.length - 1].sender_id !== currentUserId
    ) {
      markAsRead(messages[messages.length - 1].id);
    }
  }, [messages, currentUserId, markAsRead]);

  // Smart Replies State
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [generatingReplies, setGeneratingReplies] = useState(false);
  const [repliesProgress, setRepliesProgress] = useState("");

  // Load draft from localStorage when conversation changes
  useEffect(() => {
    if (activeConversationId && typeof window !== "undefined") {
      const draft = localStorage.getItem(`chat_draft_${activeConversationId}`);
      if (draft !== null) {
        setNewMessage(draft);
      } else {
        setNewMessage("");
      }
    }
  }, [activeConversationId]);

  // Handle incoming drag and drop
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        setAttachment(e.dataTransfer.files[0]);
      }
    };

    const dropZone = document.getElementById("chat-drop-zone");
    if (dropZone) {
      dropZone.addEventListener("dragover", handleDragOver);
      dropZone.addEventListener("dragleave", handleDragLeave);
      dropZone.addEventListener("drop", handleDrop);
    }

    return () => {
      if (dropZone) {
        dropZone.removeEventListener("dragover", handleDragOver);
        dropZone.removeEventListener("dragleave", handleDragLeave);
        dropZone.removeEventListener("drop", handleDrop);
      }
    };
  }, [activeConversationId]);

  const handleSuggestReplies = async () => {
    if (messages.length === 0) return;
    try {
      setGeneratingReplies(true);
      setSmartReplies([]);
      setRepliesProgress("Loading AI...");

      const { CreateMLCEngine } = await import("@mlc-ai/web-llm");
      const engine = await CreateMLCEngine(
        "Llama-3.2-1B-Instruct-q4f32_1-MLC",
        {
          initProgressCallback: (progress) => {
            setRepliesProgress(`AI: ${Math.round(progress.progress * 100)}%`);
          },
        },
      );

      setRepliesProgress("Thinking...");
      const recentMessages = messages
        .slice(-5)
        .map(
          (m) =>
            `${m.sender_id === currentUserId ? "Me" : "Them"}: ${m.content}`,
        )
        .join("\n");

      const systemPrompt = `You are a helpful assistant. Based on the following recent chat messages, suggest exactly 3 short, natural replies for "Me" to send next. Output ONLY a valid JSON array of 3 strings. Do not output anything else.`;

      const reply = await engine.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Recent messages:\n${recentMessages}` },
        ],
        response_format: { type: "json_object" },
      });

      const rawContent = reply.choices[0]?.message.content || "[]";
      let parsedData = [];
      try {
        parsedData = JSON.parse(rawContent);
      } catch (e) {
        const match = rawContent.match(/\[[\s\S]*\]/);
        if (match) parsedData = JSON.parse(match[0]);
      }

      if (Array.isArray(parsedData) && parsedData.length > 0) {
        setSmartReplies(parsedData.slice(0, 3));
      }
    } catch (error) {
      console.error("Smart replies error:", error);
      toast.error("Failed to generate smart replies");
    } finally {
      setGeneratingReplies(false);
      setRepliesProgress("");
    }
  };

  // Save draft to localStorage on change
  useEffect(() => {
    if (activeConversationId && typeof window !== "undefined") {
      if (newMessage.trim()) {
        localStorage.setItem(`chat_draft_${activeConversationId}`, newMessage);
      } else {
        localStorage.removeItem(`chat_draft_${activeConversationId}`);
      }
    }
  }, [newMessage, activeConversationId]);

  const toConversationMessage = (message: Message): ConversationMessage => ({
    id: message.id,
    conversation_id: message.conversation_id,
    sender_id: message.sender_id,
    content: message.content,
    created_at: message.created_at,
  });

  const getConversationDisplayInfo = (conv: Conversation) => {
    const participants = conv.conversation_participants || [];
    const isParticipant = participants.some(
      (p) => p.profile_id === currentUserId,
    );

    if (!forceAuditMode && (isParticipant || !isAdmin)) {
      const otherPart = participants.find(
        (p) => p.profile_id !== currentUserId,
      );
      return {
        title: conv.title || otherPart?.profiles?.full_name || "Unknown User",
        avatarUrl: otherPart?.profiles?.avatar_url || "",
        initial: otherPart?.profiles?.full_name?.charAt(0) ?? "?",
        isAudit: false,
      };
    } else {
      // Admin auditing message history between other users
      const names = participants.map(
        (p) => p.profiles?.full_name?.split(" ")[0] || "Unknown",
      );
      const fullNames = participants.map(
        (p) => p.profiles?.full_name || "Unknown",
      );
      const titleStr =
        fullNames.length === 2
          ? `${fullNames[0]} ↔ ${fullNames[1]}`
          : fullNames.length > 2
            ? `${fullNames[0]}, ${fullNames[1]} +${fullNames.length - 2} more`
            : fullNames.join(", ");

      const firstAvatar = participants[0]?.profiles?.avatar_url || "";
      const initials = names
        .slice(0, 2)
        .map((n) => n?.charAt(0) ?? "?")
        .join("");
      return {
        title: conv.title || titleStr || "No Participants",
        avatarUrl: firstAvatar,
        initial: initials || "?",
        isAudit: true,
      };
    }
  };

  const fetchUsers = async (query = "") => {
    setLoadingUsers(true);
    try {
      const data = await apiClient<{ success: boolean; data?: Profile[] }>(
        `/api/messages/users?q=${encodeURIComponent(query)}`,
      );
      if (data.success) {
        setUsers(data.data || []);
      }
    } catch {
      // Error toast is handled by apiClient
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (showNewChatDialog) {
      const timeoutId = setTimeout(() => {
        fetchUsers(userSearch);
      }, 300); // 300ms debounce
      return () => clearTimeout(timeoutId);
    }
  }, [showNewChatDialog, userSearch]);

  const startNewConversation = async (participantId: string) => {
    try {
      const data = await apiClient<{ success: boolean; conversation: Conversation }>("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId }),
      });

      if (data.success) {
        const conv = data.conversation;
        const exists = conversations.some((c) => c.id === conv.id);
        if (!exists) {
          setConversations((prev) => [conv, ...prev]);
        }
        setActiveConversationId(conv.id);
        setShowNewChatDialog(false);
        setUserSearch("");
      }
    } catch {
      // Error toast is handled by apiClient
    }
  };

  // Note: Message fetching and realtime subscription are now handled by useRealtimeMessages hook

  // Update conversation list when new messages arrive globally
  useEffect(() => {
    const globalChannel = supabase
      .channel("global_chat_updates")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const insertedMessage = payload.new as Message;

          // Fetch message profiles if not present in payload
          const fullyPopulatedMessage = { ...insertedMessage };
          if (!insertedMessage.profiles) {
            const { data } = await supabase
              .from("profiles")
              .select("id, full_name, avatar_url")
              .eq("id", insertedMessage.sender_id)
              .single();
            if (data) {
              fullyPopulatedMessage.profiles = data;
            }
          }

          setConversations((prev) =>
            prev
              .map((conv) => {
                if (conv.id === insertedMessage.conversation_id) {
                  return {
                    ...conv,
                    messages: [
                      toConversationMessage(fullyPopulatedMessage),
                      ...(conv.messages || []),
                    ],
                    updated_at: new Date().toISOString(),
                  };
                }
                return conv;
              })
              .sort(
                (a, b) =>
                  new Date(b.updated_at).getTime() -
                  new Date(a.updated_at).getTime(),
              ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(globalChannel);
    };
  }, [supabase]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      (!newMessage.trim() && !attachment) ||
      !activeConversationId ||
      isSending
    )
      return;

    setIsSending(true);
    const content = newMessage.trim();
    const currentAttachment = attachment;
    const replyToId = replyingTo ? replyingTo.id : null;

    setNewMessage(""); // Optimistic clear
    setAttachment(null);
    setReplyingTo(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(`chat_draft_${activeConversationId}`);
    }

    await sendMessage(content, currentAttachment, replyToId);
    setIsSending(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    // Limit to 5MB for example
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }
    setAttachment(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="flex h-full w-full bg-background md:divide-x relative">
      {/* Sidebar - Conversation List */}
      <ChatSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        setActiveConversationId={setActiveConversationId}
        conversationSearch={conversationSearch}
        setConversationSearch={setConversationSearch}
        showNewChatDialog={showNewChatDialog}
        setShowNewChatDialog={setShowNewChatDialog}
        userSearch={userSearch}
        setUserSearch={setUserSearch}
        users={users}
        loadingUsers={loadingUsers}
        startNewConversation={startNewConversation}
        getConversationDisplayInfo={getConversationDisplayInfo}
      />

      {/* Main Chat Area */}
      <div
        className={`flex-1 flex-col relative bg-background ${!activeConversationId ? "hidden md:flex" : "flex"}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm border-2 border-dashed border-primary flex items-center justify-center rounded-lg m-4">
            <div className="flex flex-col items-center gap-2 text-primary">
              <Upload className="w-10 h-10 animate-bounce" />
              <p className="text-xl font-bold">Drop file to attach</p>
            </div>
          </div>
        )}

        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="h-16 flex items-center px-4 md:px-6 border-b gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden shrink-0 -ml-2"
                onClick={() => setActiveConversationId(null)}
                aria-label="Back to conversations"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getConversationDisplayInfo(activeConversation).initial}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm truncate">
                    {getConversationDisplayInfo(activeConversation).title}
                  </h3>
                  {getConversationDisplayInfo(activeConversation).isAudit && (
                    <Badge
                      variant="destructive"
                      className="text-[10px] h-4 px-1 shrink-0"
                    >
                      Audit
                    </Badge>
                  )}
                </div>
                {getConversationDisplayInfo(activeConversation).isAudit && (
                  <span className="text-xs text-muted-foreground truncate">
                    Monitoring conversation
                  </span>
                )}
              </div>
            </div>

            {/* Search within conversation */}
            <div className="px-4 py-2 border-b bg-muted/20">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search in conversation..."
                  value={messageSearch}
                  onChange={(e) => setMessageSearch(e.target.value)}
                  className="pl-9 h-9 bg-background/50"
                />
              </div>
            </div>

            {/* Pinned Messages */}
            {messages.filter((m) => m.is_pinned).length > 0 && (
              <div className="bg-primary/5 border-b px-4 py-2 flex flex-col gap-1 max-h-32 overflow-y-auto">
                <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                  <Pin className="h-3 w-3" /> Pinned Messages
                </div>
                {messages
                  .filter((m) => m.is_pinned)
                  .map((pm) => (
                    <div
                      key={pm.id}
                      className="text-sm truncate text-muted-foreground bg-background/50 p-1.5 rounded border cursor-pointer hover:bg-background/80"
                      onClick={() => {
                        setMessageSearch(pm.content || "");
                      }}
                    >
                      <span className="font-medium mr-1">
                        {pm.profiles?.full_name || "User"}:
                      </span>
                      {pm.content || "Attachment"}
                    </div>
                  ))}
              </div>
            )}

            {/* Messages Scroll Area */}
            <ScrollArea className="flex-1 p-4 md:p-6" ref={scrollRef}>
              <div className="flex flex-col gap-4">
                {messages
                  .filter((msg) => {
                    if (!messageSearch.trim()) return true;
                    return msg.content
                      ?.toLowerCase()
                      .includes(messageSearch.toLowerCase());
                  })
                  .map((msg) => {
                    const isMe = msg.sender_id === currentUserId;
                    const senderName =
                      msg.profiles?.full_name ||
                      activeConversation?.conversation_participants?.find(
                        (p) => p.profile_id === msg.sender_id,
                      )?.profiles?.full_name ||
                      "Unknown";
                    const showSenderName = forceAuditMode
                      ? true
                      : !isMe &&
                        (activeConversation?.conversation_participants
                          ?.length || 0) > 2;

                    return (
                      <ChatMessageBubble
                        key={msg.id}
                        msg={msg}
                        isMe={isMe}
                        senderName={senderName}
                        showSenderName={showSenderName}
                        isAdmin={isAdmin}
                        messages={messages}
                        setReplyingTo={setReplyingTo}
                        pinMessage={pinMessage}
                      />
                    );
                  })}
              </div>
            </ScrollArea>

            {/* Typing Indicators */}
            {Object.keys(typingUsers).length > 0 && (
              <div className="px-4 py-2 text-xs text-muted-foreground flex items-center gap-1 bg-background border-t">
                <div className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"></span>
                </div>
                <span className="ml-1 font-medium text-foreground">
                  {Object.values(typingUsers).join(", ")}{" "}
                  {Object.keys(typingUsers).length === 1 ? "is" : "are"}{" "}
                  typing...
                </span>
              </div>
            )}

            {/* Audit Mode Banner — replaces input entirely (#25) */}
            {getConversationDisplayInfo(activeConversation).isAudit ? (
              <div className="p-4 bg-destructive/5 border-t border-destructive/30 flex items-center gap-3">
                <ShieldAlert className="h-5 w-5 text-destructive shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-destructive">
                    AUDIT MODE — READ ONLY
                  </p>
                  <p className="text-xs text-muted-foreground">
                    You are monitoring this conversation. Sending messages is
                    disabled.
                  </p>
                </div>
              </div>
            ) : (
              <ChatInputArea
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                attachment={attachment}
                setAttachment={setAttachment}
                fileInputRef={fileInputRef}
                generatingReplies={generatingReplies}
                smartReplies={smartReplies}
                messages={messages}
                currentUserId={currentUserId}
                handleSuggestReplies={handleSuggestReplies}
                repliesProgress={repliesProgress}
                setNewMessage={setNewMessage}
                setSmartReplies={setSmartReplies}
                handleSendMessage={handleSendMessage}
                handleFileChange={handleFileChange}
                isSending={isSending}
                newMessage={newMessage}
                sendTypingEvent={sendTypingEvent}
              />
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
            <p>Select a conversation to start auditing chat history</p>
          </div>
        )}
      </div>
    </div>
  );
}
