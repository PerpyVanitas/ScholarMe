import { describe, it, expect } from "vitest";
import { AUTH_VALIDATORS } from "../utils/validators";

describe("Auth Validators", () => {
  describe("Name Validation", () => {
    it("should reject whitespace-only names", () => {
      expect(AUTH_VALIDATORS.first_name("   ")).toBe("First name is required.");
      expect(AUTH_VALIDATORS.last_name("   ")).toBe("Last name is required.");
    });

    it("should reject names with numbers", () => {
      expect(AUTH_VALIDATORS.first_name("John123")).toBe("First name must not contain numbers.");
    });

    it("should accept valid names", () => {
      expect(AUTH_VALIDATORS.first_name("John")).toBe("");
      expect(AUTH_VALIDATORS.last_name("Doe")).toBe("");
    });
  });

  describe("Email Validation", () => {
    it("should reject malformed emails", () => {
      expect(AUTH_VALIDATORS.email("invalidemail")).toBe("Please enter a valid email address (e.g. you@example.com).");
      expect(AUTH_VALIDATORS.email("missing@tld")).toBe("Please enter a valid email address (e.g. you@example.com).");
      expect(AUTH_VALIDATORS.email("spaces in@email.com")).toBe("Please enter a valid email address (e.g. you@example.com).");
    });

    it("should accept valid emails", () => {
      expect(AUTH_VALIDATORS.email("user@example.com")).toBe("");
      expect(AUTH_VALIDATORS.email("user.name+tag@example.co.uk")).toBe("");
    });
  });

  describe("Profile Completion Fields", () => {
    it("should require degree program", () => {
      expect(AUTH_VALIDATORS.degree_program("   ")).toBe("Degree program is required.");
      expect(AUTH_VALIDATORS.degree_program("BS Computer Science")).toBe("");
    });

    it("should require valid year level", () => {
      expect(AUTH_VALIDATORS.year_level("")).toBe("Year level is required.");
      expect(AUTH_VALIDATORS.year_level("0")).toBe("Please enter a valid year level (1-6).");
      expect(AUTH_VALIDATORS.year_level("7")).toBe("Please enter a valid year level (1-6).");
      expect(AUTH_VALIDATORS.year_level("2")).toBe("");
    });
  });
});
