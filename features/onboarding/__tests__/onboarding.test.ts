import { describe, it, expect } from "vitest";

describe("Onboarding & Profile Completion (Phase 3)", () => {
  it("P3-2: Flags missing required profile fields (degree_program, year_level, membership_number)", () => {
    const validateProfile = (
      data: Record<string, unknown>,
      isTutor: boolean,
    ) => {
      const errors: Record<string, string> = {};

      if (!data.degree_program?.toString().trim()) {
        errors.degree_program = "Degree program is required";
      }

      if (!data.year_level) {
        errors.year_level = "Year level is required";
      }

      if (isTutor && !data.membership_number?.toString().trim()) {
        errors.membership_number = "Membership number is required for tutors";
      }

      return errors;
    };

    // Learner missing basic fields
    const learnerErrors = validateProfile(
      { degree_program: "", year_level: null },
      false,
    );
    expect(learnerErrors.degree_program).toBeDefined();
    expect(learnerErrors.year_level).toBeDefined();
    expect(learnerErrors.membership_number).toBeUndefined(); // not required for learners

    // Tutor missing membership number
    const tutorErrors = validateProfile(
      { degree_program: "BS CS", year_level: 3, membership_number: "" },
      true,
    );
    expect(tutorErrors.membership_number).toBeDefined();

    // Valid Tutor
    const validTutor = validateProfile(
      { degree_program: "BS CS", year_level: 3, membership_number: "2024-001" },
      true,
    );
    expect(Object.keys(validTutor).length).toBe(0);
  });
});
