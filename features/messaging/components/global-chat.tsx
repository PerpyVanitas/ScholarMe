"use client";

import { useState, useEffect } from "react";
import { MessageSquare, X, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatInterface } from "./chat-interface";
import { createClient } from "@/lib/supabase/client";
import { usePathname, useRouter } from "next/navigation";
import { Conversation } from "@/lib/types";
import { Card } from "@/components/ui/card";

export function GlobalChat({
  currentUserId,
  isAdmin,
}: {
  currentUserId: string;
  isAdmin: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialConversations, setInitialConversations] = useState<
    Conversation[]
  >([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  // Hide global chat if we're on the dedicated messages page
  const isMessagesPage = pathname?.startsWith("/dashboard/messages");

  useEffect(() => {
    if (!currentUserId || isMessagesPage) return;

    const fetchConversations = async () => {
      const supabase = createClient();
      const { data: participants } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("profile_id", currentUserId);

      const conversationIds = (participants || []).map(
        (p) => p.conversation_id,
      );

      if (conversationIds.length > 0) {
        const { data } = await supabase
          .from("conversations")
          .select(
            `
            *,
            conversation_participants(
              profile_id,
              last_read_at,
              profiles(id, full_name, avatar_url, role_id)
            ),
            messages(
              id,
              content,
              created_at,
              sender_id
            )
          `,
          )
          .in("id", conversationIds)
          .order("updated_at", { ascending: false });

        if (data) {
          const formatted = data.map((conv) => {
            const sortedMessages = conv.messages?.sort(
              (a: unknown, b: unknown) =>
                // @ts-ignore: Strict unknown type check
                new Date(b.created_at).getTime() -
                // @ts-ignore: Strict unknown type check
                new Date(a.created_at).getTime(),
            );
            return {
              ...conv,
              messages: sortedMessages,
            };
          });
          setInitialConversations(formatted as any);
        }
      }
      setLoading(false);
    };

    if (isOpen && loading) {
      fetchConversations();
    }
  }, [currentUserId, isMessagesPage, isOpen, loading]);

  if (isMessagesPage || !currentUserId) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end pointer-events-none">
      {isOpen ? (
        <Card className="pointer-events-auto shadow-2xl border-primary/20 flex flex-col overflow-hidden transition-all duration-300 ease-in-out w-[350px] sm:w-[400px] h-[500px] max-h-[80vh] mb-4">
          <div className="bg-primary text-primary-foreground p-3 flex justify-between items-center shadow-md z-10 relative">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Messages
            </h3>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground transition-colors"
                onClick={() => router.push("/dashboard/messages")}
                title="Open in full page"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className="flex-1 bg-background overflow-hidden relative">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-2">
                  <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                  <p className="text-sm text-muted-foreground">
                    Loading chats...
                  </p>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 [&>div]:h-full [&>div]:border-0 [&>div]:rounded-none">
                <ChatInterface
                  initialConversations={initialConversations}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                />
              </div>
            )}
          </div>
        </Card>
      ) : null}

      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          size="icon"
          className="pointer-events-auto h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 hover:scale-105 transition-all duration-300 relative group"
        >
          <MessageSquare className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Can add unread count here if needed */}
          </span>
        </Button>
      )}
    </div>
  );
}
