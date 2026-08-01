import { describe, it, expect } from "vitest";
import { SYSTEM_PROMPTS } from "../index";

describe("AI System Prompt Templates", () => {
  it("provides non-empty base system prompts", () => {
    expect(SYSTEM_PROMPTS.AI_TUTOR_BASE).toContain("ScholarMe AI Tutor");
    expect(SYSTEM_PROMPTS.QUIZ_GENERATOR).toContain("assessment creator");
    expect(SYSTEM_PROMPTS.FLASHCARD_GENERATOR).toContain("flashcards");
  });

  it("formats RAG context wrapper accurately", () => {
    const formatted = SYSTEM_PROMPTS.RAG_CONTEXT_WRAPPER("Doc content 123", "What is calculus?");
    expect(formatted).toContain("Doc content 123");
    expect(formatted).toContain("What is calculus?");
  });
});
