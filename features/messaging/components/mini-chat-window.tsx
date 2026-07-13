"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeMessages } from "@/features/messaging/hooks/use-realtime-messages";
import { useChatStore } from "@/features/messaging/store/use-chat-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { X, Minus, Maximize2, Send, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import type { Conversation, Profile } from "@/lib/types";

interface MiniChatWindowProps {
  conversationId: string;
  currentUserId: string;
}

export function MiniChatWindow({
  conversationId,
  currentUserId,
}: MiniChatWindowProps) {
  const { closeChat, toggleMinimize, minimizedChats } = useChatStore();
  const isMinimized = minimizedChats.includes(conversationId);
  const router = useRouter();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isSending, setIsSending] = useState(false);
  const supabase = createClient();

  const { messages, sendMessage, markAsRead } = useRealtimeMessages(
    conversationId,
    currentUserId,
    conversation?.conversation_participants?.find(
      (p) => p.profile_id === currentUserId,
    )?.profiles?.full_name || "User",
  );

  useEffect(() => {
    const fetchConversation = async () => {
      const { data } = await supabase
        .from("conversations")
        .select(
          `
          *,
          conversation_participants(
            profile_id,
            profiles(id, full_name, avatar_url, role_id)
          )
        `,
        )
        .eq("id", conversationId)
        .single();

      if (data) {
        setConversation(data as any);
      }
      setLoading(false);
    };

    fetchConversation();
  }, [conversationId, supabase]);

  useEffect(() => {
    if (
      messages.length > 0 &&
      messages[messages.length - 1].sender_id !== currentUserId &&
      !isMinimized
    ) {
      markAsRead(messages[messages.length - 1].id);
    }
  }, [messages, currentUserId, markAsRead, isMinimized]);

  useEffect(() => {
    if (scrollRef.current && !isMinimized) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isMinimized]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;
    setIsSending(true);
    try {
      await sendMessage(newMessage);
      setNewMessage("");
    } finally {
      setIsSending(false);
    }
  };

  const getOtherParticipant = () => {
    if (!conversation) return null;
    return conversation.conversation_participants?.find(
      (p) => p.profile_id !== currentUserId,
    )?.profiles;
  };

  const otherUser = getOtherParticipant();
  const title = otherUser ? otherUser.full_name : "Chat";
  const avatarUrl = otherUser?.avatar_url;
  const initial = title ? title.charAt(0).toUpperCase() : "?";

  if (loading) {
    return (
      <div className="w-14 h-14 rounded-full bg-background border shadow-lg flex items-center justify-center pointer-events-auto">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // MINIMIZED STATE (CHAT HEAD)
  if (isMinimized) {
    const unreadCount = 0; // Could be derived from messages and last_read_at if needed

    return (
      <button
        onClick={() => toggleMinimize(conversationId)}
        className="relative w-14 h-14 rounded-full shadow-lg hover:scale-105 transition-transform pointer-events-auto group"
      >
        <Avatar className="h-14 w-14 border border-border">
          <AvatarImage src={avatarUrl || ""} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {initial}
          </AvatarFallback>
        </Avatar>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {unreadCount}
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            closeChat(conversationId);
          }}
          className="absolute -top-1 -left-1 bg-background rounded-full border shadow-sm p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="h-3 w-3" />
        </button>
      </button>
    );
  }

  // EXPANDED STATE (MINI CHAT WINDOW)
  return (
    <Card className="w-[320px] h-[400px] flex flex-col shadow-xl border-primary/20 overflow-hidden pointer-events-auto animate-in slide-in-from-bottom-5">
      {/* Header */}
      <div
        className="h-12 bg-primary text-primary-foreground px-3 flex items-center justify-between shrink-0 cursor-pointer"
        onClick={() => toggleMinimize(conversationId)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Avatar className="h-8 w-8 shrink-0 border border-primary-foreground/20">
            <AvatarImage src={avatarUrl || ""} />
            <AvatarFallback className="bg-primary-foreground/10 text-primary-foreground text-xs">
              {initial}
            </AvatarFallback>
          </Avatar>
          <span className="font-semibold text-sm truncate">{title}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={(e) => {
              e.stopPropagation();
              router.push(
                `/dashboard/messages?conversationId=${conversationId}`,
              );
              closeChat(conversationId);
            }}
            title="Open in Messages app"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={(e) => {
              e.stopPropagation();
              toggleMinimize(conversationId);
            }}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={(e) => {
              e.stopPropagation();
              closeChat(conversationId);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3 bg-muted/10" ref={scrollRef}>
        <div className="flex flex-col gap-3 pb-2">
          {messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[85%] ${isMe ? "self-end items-end" : "self-start items-start"}`}
              >
                <div
                  className={`px-3 py-2 rounded-2xl text-sm ${
                    isMe
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted rounded-bl-sm"
                  }`}
                  style={{ wordBreak: "break-word" }}
                >
                  {msg.content}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-2 border-t bg-background shrink-0 flex items-center gap-2">
        <Input
          placeholder="Aa"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          className="rounded-full h-9 px-4 bg-muted/50 focus-visible:ring-1"
        />
        <Button
          size="icon"
          variant="ghost"
          className="h-9 w-9 shrink-0 text-primary"
          onClick={handleSend}
          disabled={!newMessage.trim() || isSending}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
