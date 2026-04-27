"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, MessageSquare, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Conversation, Message, Profile } from "@/lib/types";

interface ChatInterfaceProps {
  initialConversations: Conversation[];
  currentUserId: string;
}

export function ChatInterface({ initialConversations, currentUserId }: ChatInterfaceProps) {
  const supabase = createClient();
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    initialConversations.length > 0 ? initialConversations[0].id : null
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  // Helper to get the "other" user's profile in a 1-on-1 chat
  const getOtherParticipant = (conv: Conversation): Profile | null => {
    const participant = conv.conversation_participants?.find(
      (p) => p.profile_id !== currentUserId
    );
    return participant?.profiles || null;
  };

  // 1. Fetch messages for the active conversation
  useEffect(() => {
    if (!activeConversationId) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          profiles(id, full_name, avatar_url)
        `)
        .eq("conversation_id", activeConversationId)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setMessages(data as Message[]);
      }
    };

    fetchMessages();
  }, [activeConversationId, supabase]);

  // 2. Set up Supabase Realtime subscription
  useEffect(() => {
    if (!activeConversationId) return;

    const channel = supabase
      .channel(`chat_${activeConversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        async (payload) => {
          // Fetch the profile for the new message
          const { data: profileData } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url")
            .eq("id", payload.new.sender_id)
            .single();

          const newMsg = {
            ...payload.new,
            profiles: profileData,
          } as Message;

          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversationId, supabase]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversationId) return;

    const content = newMessage.trim();
    setNewMessage(""); // Optimistic clear

    const { error } = await supabase.from("messages").insert({
      conversation_id: activeConversationId,
      sender_id: currentUserId,
      content,
    });

    if (error) {
      console.error("Error sending message:", error);
      // Could show a toast here
    }
  };

  return (
    <div className="flex h-full w-full bg-background divide-x">
      {/* Sidebar - Conversation List */}
      <div className="w-80 flex flex-col bg-muted/20">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder="Search messages..." 
              className="pl-9 bg-background"
            />
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {conversations.map((conv) => {
                const otherUser = getOtherParticipant(conv);
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
                      <AvatarImage src={otherUser?.avatar_url || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {otherUser?.full_name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="font-medium text-sm truncate">
                          {conv.title || otherUser?.full_name || "Unknown User"}
                        </span>
                        {latestMessage && (
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                            {formatDistanceToNow(new Date(latestMessage.created_at), { addSuffix: true })}
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
      <div className="flex-1 flex flex-col bg-background">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="h-16 flex items-center px-6 border-b">
              <Avatar className="h-8 w-8 mr-3">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getOtherParticipant(activeConversation)?.full_name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-sm">
                  {activeConversation.title || getOtherParticipant(activeConversation)?.full_name || "Chat"}
                </h3>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6" ref={scrollRef}>
              <div className="flex flex-col gap-4">
                {messages.map((msg) => {
                  const isMe = msg.sender_id === currentUserId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-4 py-3 text-sm ${
                        isMe
                          ? "ml-auto bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <span>{msg.content}</span>
                      <span className={`text-[10px] ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Message Input */}
            <div className="p-4 bg-background border-t">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
            <p>Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
