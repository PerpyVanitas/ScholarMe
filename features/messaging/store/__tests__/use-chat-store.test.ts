import { describe, it, expect, beforeEach } from "vitest";
import { useChatStore } from "../use-chat-store";

describe("Chat Store (Zustand)", () => {
  beforeEach(() => {
    useChatStore.setState({ activeChats: [], minimizedChats: [] });
  });

  it("should open a chat and add it to activeChats", () => {
    useChatStore.getState().openChat("chat-1");
    expect(useChatStore.getState().activeChats).toContain("chat-1");
  });

  it("should not duplicate chats when opening an already active chat", () => {
    useChatStore.getState().openChat("chat-1");
    useChatStore.getState().openChat("chat-1");
    expect(useChatStore.getState().activeChats).toHaveLength(1);
  });

  it("should remove from minimizedChats when opening a chat", () => {
    useChatStore.setState({ minimizedChats: ["chat-1"] });
    useChatStore.getState().openChat("chat-1");
    expect(useChatStore.getState().minimizedChats).not.toContain("chat-1");
  });

  it("should close a chat and remove it from active and minimized", () => {
    useChatStore.setState({
      activeChats: ["chat-1", "chat-2"],
      minimizedChats: ["chat-1"],
    });
    useChatStore.getState().closeChat("chat-1");

    expect(useChatStore.getState().activeChats).not.toContain("chat-1");
    expect(useChatStore.getState().minimizedChats).not.toContain("chat-1");
    expect(useChatStore.getState().activeChats).toContain("chat-2");
  });

  it("should toggle minimize state", () => {
    useChatStore.setState({ activeChats: ["chat-1"] });

    // Minimize it
    useChatStore.getState().toggleMinimize("chat-1");
    expect(useChatStore.getState().minimizedChats).toContain("chat-1");

    // Unminimize it
    useChatStore.getState().toggleMinimize("chat-1");
    expect(useChatStore.getState().minimizedChats).not.toContain("chat-1");
  });
});
