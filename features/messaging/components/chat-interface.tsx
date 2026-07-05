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
} from "lucide-react";
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

interface ChatInterfaceProps {
  initialConversations?: Conversation[];
  currentUserId?: string;
  isAdmin?: boolean;
  forceAuditMode?: boolean;
}

export function ChatInterface({
  initialConversations = [],
  currentUserId,
  isAdmin = false,
  forceAuditMode = false,
}: ChatInterfaceProps) {
  const [supabase] = useState(() => createClient());
  const [conversations, setConversations] =
    useState<Conversation[]>(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(initialConversations.length > 0 ? initialConversations[0].id : null);

  const { messages, sendMessage } = useRealtimeMessages(
    activeConversationId,
    currentUserId,
  );
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

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId,
  );

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
      const data = await apiClient(
        `/api/messages/users?q=${encodeURIComponent(query)}`,
      );
      if (data.success) {
        setUsers(data.data || []);
      }
    } catch (e) {
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
      const data = await apiClient("/api/messages/conversations", {
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
    } catch (e) {
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

    setNewMessage(""); // Optimistic clear
    setAttachment(null);

    await sendMessage(content, currentAttachment);
    setIsSending(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Limit to 5MB for example
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setAttachment(file);
    }
  };

  return (
    <div className="flex h-full w-full bg-background md:divide-x relative">
      {/* Sidebar - Conversation List */}
      <div
        className={`w-full md:w-80 flex-col bg-muted/20 ${activeConversationId ? "hidden md:flex" : "flex"}`}
      >
        <div className="p-4 border-b flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search conversations..."
              className="pl-9 bg-background"
              value={conversationSearch}
              onChange={(e) => setConversationSearch(e.target.value)}
            />
          </div>
          <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
            <DialogTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                className="shrink-0"
                title="New Message"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>New Chat</DialogTitle>
                <DialogDescription>
                  Select a user to start a conversation.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-9 bg-background"
                  />
                </div>

                <ScrollArea className="h-[250px] pr-2">
                  {loadingUsers ? (
                    <div className="flex items-center justify-center h-40">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : users.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground text-sm">
                      No users found
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {users.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => startNewConversation(u.id)}
                          className="flex items-center gap-3 p-3 text-left rounded-md transition-colors hover:bg-muted"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={getAvatarUrl(u.avatar_url) || ""}
                            />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {u.full_name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium truncate">
                                {u.full_name}
                              </p>
                              <Badge
                                variant="secondary"
                                className="text-[10px] font-normal shrink-0"
                              >
                                {Array.isArray(u.roles)
                                  ? u.roles[0]?.name
                                  : (u.roles as any)?.name || "user"}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {u.email}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <ScrollArea className="flex-1">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground p-4 text-center">
              <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {conversations
                .filter((conv) => {
                  if (!conversationSearch.trim()) return true;
                  const info = getConversationDisplayInfo(conv);
                  return info.title
                    .toLowerCase()
                    .includes(conversationSearch.toLowerCase());
                })
                .map((conv) => {
                  const displayInfo = getConversationDisplayInfo(conv);
                  const latestMessage = conv.messages?.[0];
                  const isActive = conv.id === activeConversationId;

                  return (
                    <button
                      key={conv.id}
                      onClick={() => setActiveConversationId(conv.id)}
                      className={`flex items-start gap-3 p-4 text-left transition-colors hover:bg-muted/50 ${
                        isActive ? "bg-muted" : ""
                      }`}
                    >
                      <Avatar>
                        <AvatarImage
                          src={getAvatarUrl(displayInfo.avatarUrl) || ""}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {displayInfo.initial}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="font-medium text-sm truncate">
                            {displayInfo.title}
                          </span>
                          {latestMessage && (
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                              {formatDistanceToNow(
                                new Date(latestMessage.created_at),
                                { addSuffix: true },
                              )}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {latestMessage?.content || "No messages yet"}
                        </p>
                      </div>
                    </button>
                  );
                })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div
        className={`flex-1 flex-col bg-background ${!activeConversationId ? "hidden md:flex" : "flex"}`}
      >
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="h-16 flex items-center px-4 md:px-6 border-b gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden shrink-0 -ml-2"
                onClick={() => setActiveConversationId(null)}
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

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6" ref={scrollRef}>
              <div className="flex flex-col gap-4">
                {messages.map((msg) => {
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
                      (activeConversation?.conversation_participants?.length ||
                        0) > 2;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}
                    >
                      {showSenderName && (
                        <span
                          className={`text-[10px] font-semibold text-muted-foreground px-1 ${isMe ? "text-right" : ""}`}
                        >
                          {senderName}
                        </span>
                      )}
                      <div
                        className={`flex w-max max-w-[75%] flex-col gap-1 rounded-lg px-4 py-2 text-sm ${
                          isMe
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {msg.file_url && (
                          <div className="mb-2">
                            {msg.file_type?.startsWith("image/") ? (
                              <img
                                src={msg.file_url}
                                alt={msg.file_name || "attachment"}
                                className="max-w-[200px] max-h-[200px] rounded-md object-contain cursor-pointer"
                                onClick={() =>
                                  window.open(msg.file_url!, "_blank")
                                }
                              />
                            ) : (
                              <a
                                href={msg.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-2 bg-background/20 rounded-md hover:bg-background/40 transition-colors"
                              >
                                <FileIcon className="h-4 w-4 shrink-0" />
                                <span className="text-xs truncate max-w-[150px]">
                                  {msg.file_name || "Attachment"}
                                </span>
                                <Download className="h-3 w-3 shrink-0 ml-auto opacity-70" />
                              </a>
                            )}
                          </div>
                        )}
                        {msg.content && <span>{msg.content}</span>}
                        <span
                          className={`text-[9px] text-right ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                        >
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

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
              <div className="p-4 bg-background border-t">
                {attachment && (
                  <div className="mb-3 flex items-center gap-3 p-2 border rounded-md bg-muted/50 w-fit max-w-[80%] relative pr-8">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 absolute top-1 right-1 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => {
                        setAttachment(null);
                        if (fileInputRef.current)
                          fileInputRef.current.value = "";
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    {attachment.type.startsWith("image/") ? (
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-background border flex items-center justify-center">
                        <img
                          src={URL.createObjectURL(attachment)}
                          alt="preview"
                          className="object-cover h-full w-full"
                        />
                      </div>
                    ) : (
                      <FileIcon className="h-8 w-8 text-muted-foreground shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">
                        {attachment.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {(attachment.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                )}
                <form
                  onSubmit={handleSendMessage}
                  className="flex gap-2 items-end"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSending}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1"
                    disabled={isSending}
                  />
                  <Button
                    type="submit"
                    disabled={(!newMessage.trim() && !attachment) || isSending}
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </div>
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
