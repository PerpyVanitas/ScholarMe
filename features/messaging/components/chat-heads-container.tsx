"use client";

import { useChatStore } from "@/features/messaging/store/use-chat-store";
import { MiniChatWindow } from "./mini-chat-window";
import { usePathname } from "next/navigation";

interface ChatHeadsContainerProps {
  currentUserId: string;
}

export function ChatHeadsContainer({ currentUserId }: ChatHeadsContainerProps) {
  const { activeChats } = useChatStore();
  const pathname = usePathname();

  // Do not render on the full-screen messages page
  if (pathname?.startsWith("/dashboard/messages")) {
    return null;
  }

  if (!activeChats || activeChats.length === 0 || !currentUserId) {
    return null;
  }

  return (
    <div className="fixed bottom-0 right-16 z-50 flex items-end gap-3 pointer-events-none p-4">
      {activeChats.map((conversationId) => (
        <MiniChatWindow
          key={conversationId}
          conversationId={conversationId}
          currentUserId={currentUserId}
        />
      ))}
    </div>
  );
}
