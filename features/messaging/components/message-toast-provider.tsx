"use client";

/**
 * MessageToastProvider — MS Teams-style floating message notifications.
 *
 * Mounts globally in the dashboard layout. Subscribes to Supabase realtime
 * on the `messages` table. When a new message arrives from someone else,
 * renders a floating card in the bottom-right corner.
 *
 * Features:
 * - Stacks up to 3 toasts (oldest dismissed when 4th arrives)
 * - Auto-dismisses after 5 seconds
 * - Clicking navigates to /dashboard/messages?conversation=<id>
 * - Animates in from bottom-right
 */

import { useEffect, useCallback, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface MessageToast {
  id: string;
  conversationId: string;
  senderName: string;
  senderAvatar: string | null;
  content: string;
  arrivedAt: Date;
}

interface MessageToastProviderProps {
  currentUserId: string;
}

export function MessageToastProvider({ currentUserId }: MessageToastProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [toasts, setToasts] = useState<MessageToast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast: MessageToast) => {
    setToasts((prev) => {
      const next = [...prev, toast];
      // Keep max 3 toasts — drop oldest
      return next.slice(-3);
    });
    // Auto-dismiss after 5s
    setTimeout(() => dismiss(toast.id), 5000);
  }, [dismiss]);

  useEffect(() => {
    // Don't show toasts if already on the messages page
    if (pathname === "/dashboard/messages") return;

    const supabase = createClient();

    const channel = supabase
      .channel("global-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          const msg = payload.new as {
            id: string;
            conversation_id: string;
            sender_id: string;
            content: string;
            created_at: string;
          };

          // Ignore own messages
          if (msg.sender_id === currentUserId) return;

          // Check if current user is a participant in this conversation
          const { data: participant } = await supabase
            .from("conversation_participants")
            .select("profile_id")
            .eq("conversation_id", msg.conversation_id)
            .eq("profile_id", currentUserId)
            .maybeSingle();

          if (!participant) return;

          // Fetch sender profile
          const { data: sender } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", msg.sender_id)
            .single();

          addToast({
            id: msg.id,
            conversationId: msg.conversation_id,
            senderName: sender?.full_name ?? "Someone",
            senderAvatar: sender?.avatar_url ?? null,
            content: msg.content,
            arrivedAt: new Date(msg.created_at),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, pathname, addToast]);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-label="New messages"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex w-80 items-start gap-3 rounded-xl border border-border/60 bg-card p-3 shadow-lg shadow-black/10 dark:shadow-black/40 animate-in slide-in-from-right-5 fade-in duration-200"
        >
          {/* Avatar */}
          <Avatar className="h-9 w-9 shrink-0 mt-0.5">
            <AvatarImage src={toast.senderAvatar ?? undefined} alt={toast.senderName} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {toast.senderName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
            </AvatarFallback>
          </Avatar>

          {/* Content */}
          <button
            className="flex-1 min-w-0 text-left"
            onClick={() => {
              router.push(`/dashboard/messages?conversation=${toast.conversationId}`);
              dismiss(toast.id);
            }}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <MessageSquare className="h-3 w-3 text-primary shrink-0" />
              <span className="text-xs font-semibold text-foreground truncate">
                {toast.senderName}
              </span>
              <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                {formatDistanceToNow(toast.arrivedAt, { addSuffix: true })}
              </span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {toast.content}
            </p>
          </button>

          {/* Dismiss */}
          <button
            onClick={() => dismiss(toast.id)}
            className="shrink-0 rounded-md p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
