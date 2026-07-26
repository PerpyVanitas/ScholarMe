import { describe, expect, it } from "vitest";
import {
  ErrorCodes,
  createErrorResponse,
  createSuccessResponse,
  formatErrorForDisplay,
  mapSupabaseErrorToCode,
} from "@/lib/api-errors";

describe("api error responses", () => {
  it("creates stable error and success envelopes", () => {
    const error = createErrorResponse("AUTH_001_INVALID_CREDENTIALS", { field: "email" });
    const success = createSuccessResponse({ id: "response-id" });

    expect(error).toMatchObject({ success: false, data: null, error: { code: ErrorCodes.AUTH_001_INVALID_CREDENTIALS.code, details: { field: "email" } } });
    expect(success).toMatchObject({ success: true, data: { id: "response-id" }, error: null });
    expect(new Date(error.timestamp).getTime()).not.toBeNaN();
    expect(new Date(success.timestamp).getTime()).not.toBeNaN();
  });

  it("formats string, object, and absent details", () => {
    expect(formatErrorForDisplay({ code: "AUTH-001", message: "Invalid", details: "Try again" })).toBe("[AUTH-001] Invalid: Try again");
    expect(formatErrorForDisplay({ code: "VALID-001", message: "Invalid", details: { email: "Bad" } })).toBe("[VALID-001] Invalid: Bad");
    expect(formatErrorForDisplay({ code: "SYSTEM-001", message: "Error", details: null })).toBe("[SYSTEM-001] Error");
  });
});

describe("mapSupabaseErrorToCode", () => {
  it.each([
    ["invalid login credentials", "AUTH-001", "Invalid credentials"], ["email not confirmed", "AUTH-001", "Email not verified"],
    ["too many login attempts", "AUTH-001", "Account locked"], ["account disabled", "AUTH-001", "Account disabled"],
    ["account suspended", "AUTH-001", "Account suspended"], ["multi-factor authentication required", "AUTH-001", "Multi-factor authentication required"],
    ["token expired", "AUTH-002", "Session expired"], ["invalid token", "AUTH-002", "Invalid or expired token"],
    ["session expired", "AUTH-002", "Your session has ended"], ["not authorized", "AUTH-003", "Access denied"],
    ["forbidden", "AUTH-003", "Forbidden"], ["duplicate key", "VALID-001", "Email already registered"],
    ["password strength is weak", "VALID-001", "Password is too weak"], ["password is too short", "VALID-001", "Password too short"],
    ["password confirmation does not match", "VALID-001", "Passwords do not match"], ["invalid email", "VALID-001", "Invalid email format"],
    ["username exists", "VALID-001", "Username already taken"], ["phone format is invalid", "VALID-001", "Invalid phone number"],
    ["required value missing", "VALID-001", "Missing required field"], ["user not found", "DB-001", "User not found"],
    ["profile not found", "DB-001", "Profile not found"], ["record not found", "DB-001", "Resource not found"],
    ["constraint violation", "DB-001", "Data integrity error"], ["scheduling conflict", "BUS-001", "Scheduling conflict"],
    ["slot is unavailable", "BUS-001", "Scheduling conflict"], ["booking in the past", "BUS-001", "Cannot book in the past"],
    ["card scan failed", "BUS-002", "Card scan failed"], ["card expired", "BUS-002", "Card expired"],
    ["card blocked", "BUS-002", "Card blocked"], ["rate limit exceeded", "SYSTEM-001", "Too many requests"],
    ["request timeout", "SYSTEM-001", "Request timeout"], ["database connection failed", "SYSTEM-001", "Database error"],
    ["service unavailable", "SYSTEM-001", "Service unavailable"], ["internal server error", "SYSTEM-001", "Internal server error"],
  ])("maps %s", (input, code, message) => {
    expect(mapSupabaseErrorToCode(input)).toMatchObject({ code, message });
  });

  it("returns a safe fallback while retaining a supplied message as details", () => {
    expect(mapSupabaseErrorToCode("unexpected failure")).toMatchObject({ code: "SYSTEM-001", message: "An error occurred", details: "unexpected failure" });
    expect(mapSupabaseErrorToCode("").details).toBe("Please try again later or contact support.");
  });
});
