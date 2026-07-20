"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { MessageCircle, X, Send, CheckCheck } from "lucide-react";
import { SupportTicket, SupportMessage } from "@/lib/types";
import { toast } from "sonner";

export function SupportChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [input, setInput] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function initChat() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Find active ticket
      const { data: existingTicket } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", user.id)
        .neq("status", "resolved")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (existingTicket) {
        setTicket(existingTicket);
        fetchMessages(existingTicket.id);
      }
    }
    
    initChat();
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, []);

  useEffect(() => {
    if (ticket) {
      const channel = supabase
        .channel(`support-${ticket.id}`)
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `ticket_id=eq.${ticket.id}`
        }, (payload) => {
          setMessages(prev => [...prev, payload.new as SupportMessage]);
          scrollToBottom();
        })
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      }
    }
  }, [ticket, scrollToBottom, supabase]);



  async function fetchMessages(ticketId: string) {
    const { data } = await supabase
      .from("support_messages")
      .select("*, profiles(full_name)")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });
    
    if (data) {
      setMessages(data);
      scrollToBottom();
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !userId) return;

    const content = input;
    setInput("");

    let currentTicketId = ticket?.id;

    if (!currentTicketId) {
      // Create new ticket
      const { data: newTicket, error } = await supabase
        .from("support_tickets")
        .insert({ user_id: userId, status: "open" })
        .select()
        .single();
        
      if (error || !newTicket) {
        toast.error("Failed to start chat.");
        return;
      }
      
      setTicket(newTicket);
      currentTicketId = newTicket.id;
    }

    await supabase.from("support_messages").insert({
      ticket_id: currentTicketId,
      sender_id: userId,
      content
    });
    
    scrollToBottom();
  }

  if (!userId) return null; // Don't show for unauthenticated users

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen ? (
        <Card className="w-80 h-[450px] shadow-2xl flex flex-col mb-4 border-border/60 overflow-hidden animate-in slide-in-from-bottom-5">
          <CardHeader className="p-4 bg-primary text-primary-foreground flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <MessageCircle className="h-4 w-4" /> Live Support
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-primary-foreground/20 text-primary-foreground" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="flex-1 p-4 overflow-y-auto bg-muted/30 flex flex-col gap-3">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center px-4 flex-col gap-2">
                <MessageCircle className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Send a message to start a chat with our support team.</p>
              </div>
            ) : (
              messages.map((msg, i) => {
                const isMe = msg.sender_id === userId;
                return (
                  <div key={msg.id || i} className={`flex flex-col max-w-[85%] ${isMe ? 'self-end' : 'self-start'}`}>
                    <div className={`px-3 py-2 rounded-2xl text-sm flex flex-col gap-1 ${isMe ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-background border shadow-sm rounded-bl-none'}`}>
                      <span>{msg.content}</span>
                      {msg.created_at && (
                        <div className={`flex items-center gap-1 mt-1 text-[9px] ${isMe ? "text-primary-foreground/70 justify-end" : "text-muted-foreground justify-end"}`}>
                          <span>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {isMe && <CheckCheck className="h-3 w-3 ml-0.5" />}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </CardContent>
          
          <CardFooter className="p-3 border-t bg-background">
            <form onSubmit={handleSend} className="flex w-full gap-2">
              <Input 
                value={input} 
                onChange={e => setInput(e.target.value)} 
                placeholder="Type a message..." 
                className="flex-1"
                disabled={ticket?.status === "resolved"}
              />
              <Button type="submit" size="icon" disabled={!input.trim() || ticket?.status === "resolved"}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      ) : (
        <Button 
          size="lg" 
          className="rounded-full h-14 w-14 shadow-xl hover:scale-105 transition-transform"
          onClick={() => setIsOpen(true)}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}
