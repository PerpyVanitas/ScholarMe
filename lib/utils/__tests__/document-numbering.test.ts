import { describe, it, expect } from "vitest";
import { generateDocumentNumber } from "../document-numbering";

describe("Document Numbering Generator", () => {
  it("formats document number according to Policy Section XVI", () => {
    const fixedDate = new Date("2026-06-05");
    const docNum = generateDocumentNumber(
      "BUDGET",
      "Leadership Seminar",
      "Bugas Yessuah Leih Ande",
      fixedDate
    );

    expect(docNum).toBe("BUDGET_LeadershipSeminar_BugasYessuahLeihAnde_06-05-2026");
  });

  it("handles special characters in project and officer names", () => {
    const fixedDate = new Date("2026-08-02");
    const docNum = generateDocumentNumber(
      "LIQUIDATION",
      "Team-Building & Workshop!",
      "John O'Connor",
      fixedDate
    );

    expect(docNum).toBe("LIQUIDATION_TeamBuildingWorkshop_JohnOConnor_08-02-2026");
  });
});
