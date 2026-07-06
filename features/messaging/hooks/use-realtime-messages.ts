"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Message } from "@/lib/types";

export function useRealtimeMessages(
  conversationId: string | null,
  currentUserId: string | undefined,
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const supabase = createClient();

  useEffect(() => {
    if (!conversationId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select(
          `
          id,
          conversation_id,
          sender_id,
          content,
          file_url,
          file_name,
          file_type,
          file_size,
          created_at,
          sender:profiles!sender_id (
            id,
            full_name,
            avatar_url
          )
        `,
        )
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        toast.error("Failed to load messages");
      } else {
        setMessages(data || []);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const insertedMessage = payload.new as Message;
          // Ignore if it's already in the list (e.g., from optimistic update)

          // Fetch sender profile since postgres_changes doesn't include relations
          const { data: senderData } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url")
            .eq("id", insertedMessage.sender_id)
            .single();

          const fullyPopulatedMessage = {
            ...insertedMessage,
            sender: senderData || undefined,
          };

          setMessages((prev) => {
            // Remove corresponding optimistic message if it exists
            const filtered = prev.filter(
              (m) =>
                !(
                  m.id.startsWith("opt-") &&
                  m.content === fullyPopulatedMessage.content
                ),
            );
            // Prevent duplicates
            if (filtered.some((m) => m.id === fullyPopulatedMessage.id))
              return filtered;
            return [...filtered, fullyPopulatedMessage];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, supabase]);

  const sendMessage = useCallback(
    async (content: string, file?: File | null) => {
      if ((!content.trim() && !file) || !conversationId || !currentUserId)
        return;

      const trimmedContent = content.trim();
      let fileUrl = null;
      let fileName = null;
      let fileType = null;
      let fileSize = null;

      if (file) {
        fileName = file.name;
        fileType = file.type;
        fileSize = file.size;
        const fileExt = fileName.split(".").pop();
        const filePath = `${currentUserId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("chat-attachments")
          .upload(filePath, file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          toast.error("Failed to upload file");
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from("chat-attachments")
          .getPublicUrl(filePath);

        fileUrl = publicUrlData.publicUrl;
      }

      // Optimistic UI Update
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const optimisticMessage: any = {
        id: `opt-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: trimmedContent,
        file_url: fileUrl,
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, optimisticMessage]);

      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: trimmedContent,
        file_url: fileUrl,
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize,
      });

      if (error) {
        console.error("Error sending message:", error);
        setMessages((prev) =>
          prev.filter((m) => m.id !== optimisticMessage.id),
        );
        toast.error("Failed to send message");
      }
    },
    [conversationId, currentUserId, supabase],
  );

  return { messages, sendMessage };
}
