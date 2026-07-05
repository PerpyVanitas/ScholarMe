"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, MessageSquare, Search, Plus, Loader2 } from "lucide-react";
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
import type { Conversation, ConversationMessage, Message, Profile } from "@/lib/types";

interface ChatInterfaceProps {
  initialConversations: Conversation[];
  currentUserId: string;
  isAdmin?: boolean;
}

export function ChatInterface({ initialConversations, currentUserId, isAdmin = false }: ChatInterfaceProps) {
  const supabase = createClient();
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    initialConversations.length > 0 ? initialConversations[0].id : null
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // New Chat States
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  const toConversationMessage = (message: Message): ConversationMessage => ({
    id: message.id,
    conversation_id: message.conversation_id,
    sender_id: message.sender_id,
    content: message.content,
    created_at: message.created_at,
  });

  const getConversationDisplayInfo = (conv: Conversation) => {
    const participants = conv.conversation_participants || [];
    const isParticipant = participants.some(p => p.profile_id === currentUserId);
    
    if (isParticipant || !isAdmin) {
      const otherPart = participants.find(p => p.profile_id !== currentUserId);
      return {
        title: conv.title || otherPart?.profiles?.full_name || "Unknown User",
        avatarUrl: otherPart?.profiles?.avatar_url || "",
        initial: otherPart?.profiles?.full_name?.charAt(0) || "?"
      };
    } else {
      // Admin auditing message history between other users
      const names = participants.map(p => p.profiles?.full_name || "Unknown").join(" & ");
      const firstAvatar = participants[0]?.profiles?.avatar_url || "";
      const initials = participants.map(p => p.profiles?.full_name?.charAt(0) || "?").join("");
      return {
        title: conv.title || names || "No Participants",
        avatarUrl: firstAvatar,
        initial: initials || "?"
      };
    }
  };

  const getOtherParticipant = (conv: Conversation): Profile | null => {
    const participant = conv.conversation_participants?.find(
      (p) => p.profile_id !== currentUserId
    );
    return participant?.profiles || null;
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/messages/users");
      const data = await res.json();
      if (data.success) {
        setUsers(data.data || []);
      } else {
        toast.error(data.error || "Failed to load users");
      }
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (showNewChatDialog) {
      fetchUsers();
    }
  }, [showNewChatDialog]);

  const startNewConversation = async (participantId: string) => {
    try {
      const res = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId })
      });
      const data = await res.json();
      if (data.success) {
        const conv = data.conversation;
        const exists = conversations.some(c => c.id === conv.id);
        if (!exists) {
          setConversations(prev => [conv, ...prev]);
        }
        setActiveConversationId(conv.id);
        setShowNewChatDialog(false);
        setUserSearch("");
      } else {
        toast.error(data.error || "Failed to start conversation");
      }
    } catch {
      toast.error("Failed to start conversation");
    }
  };

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

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

  useEffect(() => {
    const globalChannel = supabase
      .channel('global_chat_updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
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

          setConversations(prev => prev.map(conv => {
            if (conv.id === insertedMessage.conversation_id) {
              return {
                ...conv,
                messages: [toConversationMessage(fullyPopulatedMessage), ...(conv.messages || [])],
                updated_at: new Date().toISOString()
              };
            }
            return conv;
          }).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()));

          if (insertedMessage.conversation_id === activeConversationId) {
             setMessages(prev => [...prev, fullyPopulatedMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(globalChannel);
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
    }
  };

  return (
    <div className="flex h-full w-full bg-background divide-x">
      {/* Sidebar - Conversation List */}
      <div className="w-80 flex flex-col bg-muted/20">
        <div className="p-4 border-b flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder="Search messages..." 
              className="pl-9 bg-background"
            />
          </div>
          <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
            <DialogTrigger asChild>
              <Button size="icon" variant="outline" className="shrink-0" title="New Message">
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
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground text-sm">
                      No users found
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {filteredUsers.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => startNewConversation(u.id)}
                          className="flex items-center gap-3 p-3 text-left rounded-md transition-colors hover:bg-muted"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={u.avatar_url || ""} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {u.full_name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium truncate">{u.full_name}</p>
                              <Badge variant="secondary" className="text-[10px] font-normal shrink-0">
                                {u.role}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
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
              {conversations.map((conv) => {
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
                      <AvatarImage src={displayInfo.avatarUrl || ""} />
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
                  {getConversationDisplayInfo(activeConversation).initial}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-sm">
                  {getConversationDisplayInfo(activeConversation).title}
                </h3>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6" ref={scrollRef}>
              <div className="flex flex-col gap-4">
                {messages.map((msg) => {
                  const isMe = msg.sender_id === currentUserId;
                  const showSenderName = !isMe && (isAdmin || (activeConversation?.conversation_participants?.length || 0) > 2);
                  const senderName = msg.profiles?.full_name || "Unknown";

                  return (
                    <div key={msg.id} className={`flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}>
                      {showSenderName && (
                        <span className="text-[10px] font-semibold text-muted-foreground px-1">
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
                        <span>{msg.content}</span>
                        <span className={`text-[9px] text-right ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
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
            <p>Select a conversation to start auditing chat history</p>
          </div>
        )}
      </div>
    </div>
  );
}
