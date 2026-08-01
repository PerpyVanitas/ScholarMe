"use client";

import { useEffect, useState } from "react";

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

const STORAGE_KEY = "scholarme_ai_tutor_messages_v1";

/**
 * Hook providing persistent client-side storage for AI Tutor conversation history.
 * Preserves chat context across page refreshes and browser tab navigation.
 */
export function useAiTutorSession() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setMessages(JSON.parse(stored));
      }
    } catch {
      // Fallback on storage errors
    } finally {
      setLoaded(true);
    }
  }, []);

  function addMessage(msg: Omit<ChatMessage, "id" | "timestamp">) {
    const newMsg: ChatMessage = {
      ...msg,
      id: Math.random().toString(36).slice(2, 9),
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => {
      const updated = [...prev, newMsg];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Storage limit exceeded
      }
      return updated;
    });
  }

  function clearSession() {
    setMessages([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignored
    }
  }

  return { messages, loaded, addMessage, clearSession };
}
