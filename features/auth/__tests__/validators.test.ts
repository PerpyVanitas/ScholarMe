import { describe, it, expect } from "vitest";
import { AUTH_VALIDATORS } from "../utils/validators";

describe("Auth Validators", () => {
  describe("Name Validation", () => {
    it("should reject whitespace-only names", () => {
      expect(AUTH_VALIDATORS.first_name("   ")).toBe("First name is required.");
      expect(AUTH_VALIDATORS.last_name("   ")).toBe("Last name is required.");
    });

    it("should reject names with numbers", () => {
      expect(AUTH_VALIDATORS.first_name("John123")).toBe(
        "First name must not contain numbers.",
      );
    });

    it("should reject names shorter than 2 characters", () => {
      expect(AUTH_VALIDATORS.first_name("J")).toBe(
        "First name must be at least 2 characters.",
      );
      expect(AUTH_VALIDATORS.last_name("D")).toBe(
        "Last name must be at least 2 characters.",
      );
    });

    it("should accept valid names", () => {
      expect(AUTH_VALIDATORS.first_name("John")).toBe("");
      expect(AUTH_VALIDATORS.last_name("Doe")).toBe("");
    });
  });

  describe("Phone Validation", () => {
    it("should reject empty phone numbers", () => {
      expect(AUTH_VALIDATORS.phone_number("   ")).toBe(
        "Mobile number is required.",
      );
    });

    it("should accept local Philippine mobile format", () => {
      expect(AUTH_VALIDATORS.phone_number("09171234567")).toBe("");
      expect(AUTH_VALIDATORS.phone_number("0917 123 4567")).toBe("");
    });

    it("should accept international Philippine mobile format", () => {
      expect(AUTH_VALIDATORS.phone_number("+63 917 123 4567")).toBe("");
      expect(AUTH_VALIDATORS.phone_number("639171234567")).toBe("");
    });

    it("should reject invalid phone numbers", () => {
      expect(AUTH_VALIDATORS.phone_number("12345")).toBe(
        "Enter a valid Philippine mobile number (e.g. +63 917 123 4567 or 0917 123 4567).",
      );
    });
  });

  describe("Date of Birth Validation", () => {
    it("should require date of birth", () => {
      expect(AUTH_VALIDATORS.date_of_birth("")).toBe(
        "Date of birth is required.",
      );
    });

    it("should reject invalid dates", () => {
      expect(AUTH_VALIDATORS.date_of_birth("not-a-date")).toBe(
        "Please enter a valid date.",
      );
    });

    it("should reject future dates", () => {
      expect(AUTH_VALIDATORS.date_of_birth("2099-01-01")).toBe(
        "Date of birth cannot be in the future.",
      );
    });

    it("should reject users under 13", () => {
      expect(AUTH_VALIDATORS.date_of_birth("2020-01-01")).toBe(
        "You must be at least 13 years old to register.",
      );
    });

    it("should reject implausible ages", () => {
      expect(AUTH_VALIDATORS.date_of_birth("1800-01-01")).toBe(
        "Please enter a valid date of birth.",
      );
    });

    it("should accept valid adult dates", () => {
      expect(AUTH_VALIDATORS.date_of_birth("2000-06-15")).toBe("");
    });

    it("adjusts age when birthday has not occurred yet this year", () => {
      expect(AUTH_VALIDATORS.date_of_birth("2013-12-31")).toBe(
        "You must be at least 13 years old to register.",
      );
    });
  });

  describe("Confirm Password Validation", () => {
    it("should require confirmation", () => {
      expect(AUTH_VALIDATORS.confirmPassword("")).toBe(
        "Please confirm your password.",
      );
      expect(AUTH_VALIDATORS.confirmPassword("   ")).toBe(
        "Please confirm your password.",
      );
    });

    it("should accept non-empty confirmation", () => {
      expect(AUTH_VALIDATORS.confirmPassword("ValidPass123!")).toBe("");
    });
  });

  describe("Email Validation", () => {
    it("should reject malformed emails", () => {
      expect(AUTH_VALIDATORS.email("invalidemail")).toBe(
        "Please enter a valid email address (e.g. you@example.com).",
      );
      expect(AUTH_VALIDATORS.email("missing@tld")).toBe(
        "Please enter a valid email address (e.g. you@example.com).",
      );
      expect(AUTH_VALIDATORS.email("spaces in@email.com")).toBe(
        "Please enter a valid email address (e.g. you@example.com).",
      );
    });

    it("should accept valid emails", () => {
      expect(AUTH_VALIDATORS.email("user@example.com")).toBe("");
      expect(AUTH_VALIDATORS.email("user.name+tag@example.co.uk")).toBe("");
    });
  });

  describe("Profile Completion Fields", () => {
    it("should require degree program", () => {
      expect(AUTH_VALIDATORS.degree_program("   ")).toBe(
        "Degree program is required.",
      );
      expect(AUTH_VALIDATORS.degree_program("BS Computer Science")).toBe("");
    });

    it("should require valid year level", () => {
      expect(AUTH_VALIDATORS.year_level("")).toBe("Year level is required.");
      expect(AUTH_VALIDATORS.year_level("0")).toBe(
        "Please enter a valid year level (1-6).",
      );
      expect(AUTH_VALIDATORS.year_level("7")).toBe(
        "Please enter a valid year level (1-6).",
      );
      expect(AUTH_VALIDATORS.year_level("2")).toBe("");
    });
  });

  describe("Password Validation", () => {
    it("should enforce Supabase complexity rules", () => {
      expect(AUTH_VALIDATORS.password("short")).toBe(
        "Password must be at least 8 characters.",
      );
      expect(AUTH_VALIDATORS.password("ALLCAPS123!")).toBe(
        "Password must contain at least one lowercase letter.",
      );
      expect(AUTH_VALIDATORS.password("lowercase123!")).toBe(
        "Password must contain at least one uppercase letter.",
      );
      expect(AUTH_VALIDATORS.password("NoDigitsHere!")).toBe(
        "Password must contain at least one number.",
      );
      expect(AUTH_VALIDATORS.password("NoSymbol123")).toBe(
        "Password must contain at least one symbol (e.g. !@#$%^&*).",
      );
      expect(AUTH_VALIDATORS.password("ValidPass123!")).toBe("");
    });
  });
});
