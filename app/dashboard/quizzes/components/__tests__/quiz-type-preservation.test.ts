import { describe, it, expect } from "vitest";

describe("Quiz Item Type Mapping", () => {
  it("preserves explicit true_false item types when derivedType is mixed", () => {
    const derivedType = "mixed";
    const item: { question?: string; answer?: string; type?: string } = {
      question: "Is Sky Blue?",
      answer: "True",
      type: "true_false",
    };

    const mapped = {
      question: item.question || "",
      answer: item.answer || "",
      type: item.type || (derivedType === "mixed" ? "multiple_choice" : derivedType),
      item_type: item.type || (derivedType === "mixed" ? "multiple_choice" : derivedType),
    };

    expect(mapped.type).toBe("true_false");
    expect(mapped.item_type).toBe("true_false");
  });

  it("falls back to derivedType when item.type is missing", () => {
    const derivedType = "mixed";
    const item: { question?: string; answer?: string; type?: string } = {
      question: "What is 2+2?",
      answer: "4",
    };

    const mapped = {
      question: item.question || "",
      answer: item.answer || "",
      type: item.type || (derivedType === "mixed" ? "multiple_choice" : derivedType),
      item_type: item.type || (derivedType === "mixed" ? "multiple_choice" : derivedType),
    };

    expect(mapped.type).toBe("multiple_choice");
    expect(mapped.item_type).toBe("multiple_choice");
  });
});
