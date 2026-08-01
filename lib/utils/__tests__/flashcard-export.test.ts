import { describe, it, expect } from "vitest";
import { exportFlashcardsToAnkiCsv } from "../flashcard-export";

describe("exportFlashcardsToAnkiCsv Utility", () => {
  it("formats flashcards as tab-separated Anki CSV format", () => {
    const cards = [
      { front: "What is derivative?", back: "Rate of change", tags: ["math", "calculus"] },
      { front: "What is integral?", back: "Area under curve" },
    ];

    const result = exportFlashcardsToAnkiCsv(cards);
    expect(result).toContain("#separator:Tab");
    expect(result).toContain("What is derivative?\tRate of change\tmath calculus");
    expect(result).toContain("What is integral?\tArea under curve\tscholarme");
  });
});
