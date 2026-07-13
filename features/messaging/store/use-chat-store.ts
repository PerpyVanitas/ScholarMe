import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ChatState {
  activeChats: string[]; // conversation IDs
  minimizedChats: string[]; // conversation IDs
  openChat: (conversationId: string) => void;
  closeChat: (conversationId: string) => void;
  toggleMinimize: (conversationId: string) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      activeChats: [],
      minimizedChats: [],
      openChat: (conversationId) =>
        set((state) => {
          const newActive = state.activeChats.includes(conversationId)
            ? state.activeChats
            : [...state.activeChats, conversationId];

          // When opening, ensure it is not minimized
          const newMinimized = state.minimizedChats.filter(
            (id) => id !== conversationId,
          );

          return { activeChats: newActive, minimizedChats: newMinimized };
        }),
      closeChat: (conversationId) =>
        set((state) => ({
          activeChats: state.activeChats.filter((id) => id !== conversationId),
          minimizedChats: state.minimizedChats.filter(
            (id) => id !== conversationId,
          ),
        })),
      toggleMinimize: (conversationId) =>
        set((state) => {
          if (state.minimizedChats.includes(conversationId)) {
            return {
              minimizedChats: state.minimizedChats.filter(
                (id) => id !== conversationId,
              ),
            };
          } else {
            return {
              minimizedChats: [...state.minimizedChats, conversationId],
            };
          }
        }),
    }),
    {
      name: "scholarme-chat-store",
    },
  ),
);
