"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { getAvatarUrl } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export interface StudyGroupMessage {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: { full_name: string; avatar_url: string | null };
}

export function StudyGroupChat({
  groupId,
  currentUserId,
}: {
  groupId: string;
  currentUserId: string;
}) {
  const [messages, setMessages] = useState<StudyGroupMessage[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const supabase = createClient();

  const fetchMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from("study_group_messages")
      .select("*, profiles:user_id(full_name, avatar_url)")
      .eq("group_id", groupId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      toast.error("Failed to load group chat");
    } else {
      setMessages((data as StudyGroupMessage[]) || []);
    }
    setLoading(false);
  }, [groupId, supabase]);

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`study-group:${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "study_group_messages",
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          const inserted = payload.new as StudyGroupMessage;
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", inserted.user_id)
            .single();

          setMessages((prev) => {
            if (prev.some((m) => m.id === inserted.id)) return prev;
            return [...prev, { ...inserted, profiles: profile || undefined }];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, supabase, fetchMessages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSending(true);

    const { error } = await supabase.from("study_group_messages").insert({
      group_id: groupId,
      user_id: currentUserId,
      content: content.trim(),
    });

    if (error) {
      toast.error("Failed to send message");
    } else {
      setContent("");
    }
    setSending(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto rounded-lg border p-4 bg-muted/20">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No messages yet. Say hello to your study group!
          </p>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.user_id === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={getAvatarUrl(msg.profiles?.avatar_url)} />
                  <AvatarFallback>
                    {msg.profiles?.full_name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                    isOwn
                      ? "bg-primary text-primary-foreground"
                      : "bg-background border"
                  }`}
                >
                  {!isOwn && (
                    <p className="text-xs font-medium mb-0.5 opacity-80">
                      {msg.profiles?.full_name || "Member"}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <p
                    className={`text-[10px] mt-1 ${isOwn ? "opacity-70" : "text-muted-foreground"}`}
                  >
                    {formatDistanceToNow(new Date(msg.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Message your study group..."
          disabled={sending}
        />
        <Button type="submit" size="icon" disabled={sending || !content.trim()}>
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
