import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { useAiTutorSession } from "../use-ai-tutor-session";

describe("useAiTutorSession Hook", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("initializes with empty messages array", () => {
    const { result } = renderHook(() => useAiTutorSession());
    expect(result.current.messages).toEqual([]);
    expect(result.current.loaded).toBe(true);
  });

  it("adds and persists messages in localStorage", () => {
    const { result } = renderHook(() => useAiTutorSession());

    act(() => {
      result.current.addMessage({ sender: "user", text: "What is calculus?" });
    });

    expect(result.current.messages.length).toBe(1);
    expect(result.current.messages[0].text).toBe("What is calculus?");

    const stored = localStorage.getItem("scholarme_ai_tutor_messages_v1");
    expect(stored).toContain("What is calculus?");
  });

  it("clears session history cleanly", () => {
    const { result } = renderHook(() => useAiTutorSession());

    act(() => {
      result.current.addMessage({ sender: "user", text: "Hello AI" });
    });

    expect(result.current.messages.length).toBe(1);

    act(() => {
      result.current.clearSession();
    });

    expect(result.current.messages.length).toBe(0);
    expect(localStorage.getItem("scholarme_ai_tutor_messages_v1")).toBeNull();
  });
});
