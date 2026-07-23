"use client";

import { useState, useEffect, useRef, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, CheckCircle } from "lucide-react";
import Link from "next/link";
import { SupportMessage } from "@/lib/types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface SupportTicketDetail {
  id: string;
  user_id: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  created_at: string;
  profiles?: { full_name?: string | null; email?: string | null } | null;
}

export default function AdminSupportChat({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [ticket, setTicket] = useState<SupportTicketDetail | null>(null);
  const [input, setInput] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);

      const { data: ticketData } = await supabase
        .from("support_tickets")
        .select("*, profiles:user_id(full_name)")
        .eq("id", id)
        .single();
      
      if (ticketData) setTicket(ticketData as unknown as SupportTicketDetail);

      fetchMessages();
    }
    init();
  }, [id, supabase]);

  useEffect(() => {
    const channel = supabase
      .channel(`support-${id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "support_messages",
        filter: `ticket_id=eq.${id}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as SupportMessage]);
        scrollToBottom();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, supabase]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  async function fetchMessages() {
    const { data } = await supabase
      .from("support_messages")
      .select("*, profiles(full_name)")
      .eq("ticket_id", id)
      .order("created_at", { ascending: true });
    
    if (data) {
      setMessages(data as unknown as SupportMessage[]);
      scrollToBottom();
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !userId) return;

    const content = input;
    setInput("");

    await supabase.from("support_messages").insert({
      ticket_id: id,
      sender_id: userId,
      content
    });
    
    if (ticket && ticket.status === "open") {
      await supabase.from("support_tickets").update({ status: "in_progress" }).eq("id", id);
      setTicket({ ...ticket, status: "in_progress" });
    }
    
    scrollToBottom();
  }

  async function resolveTicket() {
    await supabase.from("support_tickets").update({ status: "resolved" }).eq("id", id);
    toast.success("Ticket resolved");
    router.push("/dashboard/admin/support");
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link href="/dashboard/admin/support">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Inbox
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            Chat with {ticket?.profiles?.full_name || "User"}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={ticket?.status === 'resolved' ? 'outline' : ticket?.status === 'open' ? 'destructive' : 'default'}>
              {ticket?.status || "Loading..."}
            </Badge>
            <span className="text-sm text-muted-foreground">Ticket ID: {id}</span>
          </div>
        </div>
        
        {ticket?.status !== "resolved" && (
          <Button variant="outline" onClick={resolveTicket} className="gap-2">
            <CheckCircle className="h-4 w-4" /> Resolve Ticket
          </Button>
        )}
      </div>

      <Card className="h-[500px] flex flex-col border-border/60">
        <CardContent className="flex-1 p-4 overflow-y-auto bg-muted/30 flex flex-col gap-4">
          {messages.map((msg, i) => {
            const isMe = msg.sender_id === userId;
            const senderFullName = (msg.profiles as unknown as { full_name?: string })?.full_name || "User";
            return (
              <div key={msg.id || i} className={`flex flex-col max-w-[70%] ${isMe ? 'self-end' : 'self-start'}`}>
                {!isMe && <span className="text-xs text-muted-foreground mb-1 ml-1">{senderFullName}</span>}
                <div className={`px-4 py-2 rounded-2xl text-sm ${isMe ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-background border shadow-sm rounded-bl-none'}`}>
                  {msg.content}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </CardContent>
        
        <CardFooter className="p-4 border-t bg-background">
          <form onSubmit={handleSend} className="flex w-full gap-2">
            <Input 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              placeholder="Type a reply..." 
              className="flex-1 text-xs"
              disabled={ticket?.status === "resolved"}
            />
            <Button type="submit" disabled={!input.trim() || ticket?.status === "resolved"} size="sm">
              <Send className="h-4 w-4 mr-2" /> Send
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
