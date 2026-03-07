/**
 * ScholarMe Error Codes - Based on SDD Section 5.3
 * 
 * Response Structure:
 * {
 *   "success": boolean,
 *   "data": object | null,
 *   "error": {
 *     "code": string,
 *     "message": string,
 *     "details": object | null
 *   },
 *   "timestamp": string
 * }
 */

export const ErrorCodes = {
  // Authentication Errors
  AUTH_001: {
    code: "AUTH-001",
    message: "Invalid credentials",
    details: "Card ID or PIN is incorrect",
  },
  AUTH_002: {
    code: "AUTH-002",
    message: "Token expired",
    details: "Your session has expired. Please sign in again.",
  },
  AUTH_003: {
    code: "AUTH-003",
    message: "Access denied",
    details: "You do not have permission to access this resource.",
  },

  // Validation Errors
  VALID_001: {
    code: "VALID-001",
    message: "Validation failed",
    details: null as Record<string, string> | null,
  },

  // Database/Resource Errors
  DB_001: {
    code: "DB-001",
    message: "Resource not found",
    details: "The requested resource does not exist.",
  },

  // Business Logic Errors
  BUS_001: {
    code: "BUS-001",
    message: "Scheduling conflict",
    details: "The requested time slot is not available.",
  },
  BUS_002: {
    code: "BUS-002",
    message: "Scan failure",
    details: "Failed to scan the card. Please try again.",
  },

  // System Errors
  SYSTEM_001: {
    code: "SYSTEM-001",
    message: "Internal server error",
    details: "An unexpected error occurred. Please try again later.",
  },
} as const;

export type ErrorCode = keyof typeof ErrorCodes;

export interface ApiErrorResponse {
  success: false;
  data: null;
  error: {
    code: string;
    message: string;
    details: string | Record<string, string> | null;
  };
  timestamp: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  error: null;
  timestamp: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Creates a standardized error response according to SDD
 */
export function createErrorResponse(
  errorCode: ErrorCode,
  customDetails?: string | Record<string, string> | null
): ApiErrorResponse {
  const error = ErrorCodes[errorCode];
  return {
    success: false,
    data: null,
    error: {
      code: error.code,
      message: error.message,
      details: customDetails !== undefined ? customDetails : error.details,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a standardized success response according to SDD
 */
export function createSuccessResponse<T>(data: T): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    error: null,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Maps Supabase auth error messages to SDD error codes
 */
export function mapSupabaseErrorToCode(errorMessage: string): {
  code: string;
  message: string;
  details: string;
} {
  const lowerMessage = errorMessage.toLowerCase();

  // Invalid credentials
  if (
    lowerMessage.includes("invalid login credentials") ||
    lowerMessage.includes("invalid email or password") ||
    lowerMessage.includes("email not confirmed")
  ) {
    return {
      code: "AUTH-001",
      message: "Invalid credentials",
      details: "Email or password is incorrect. Please check your credentials and try again.",
    };
  }

  // User not found
  if (
    lowerMessage.includes("user not found") ||
    lowerMessage.includes("no user found")
  ) {
    return {
      code: "DB-001",
      message: "Account not found",
      details: "No account exists with this email address. Please sign up first.",
    };
  }

  // Email already exists
  if (
    lowerMessage.includes("already registered") ||
    lowerMessage.includes("already exists") ||
    lowerMessage.includes("duplicate")
  ) {
    return {
      code: "VALID-001",
      message: "Email already registered",
      details: "An account with this email already exists. Please sign in instead.",
    };
  }

  // Password validation
  if (
    lowerMessage.includes("password") &&
    (lowerMessage.includes("weak") ||
      lowerMessage.includes("short") ||
      lowerMessage.includes("at least"))
  ) {
    return {
      code: "VALID-001",
      message: "Password too weak",
      details: "Password must be at least 6 characters long.",
    };
  }

  // Email validation
  if (
    lowerMessage.includes("invalid email") ||
    lowerMessage.includes("email format")
  ) {
    return {
      code: "VALID-001",
      message: "Invalid email format",
      details: "Please enter a valid email address.",
    };
  }

  // Rate limiting
  if (
    lowerMessage.includes("rate limit") ||
    lowerMessage.includes("too many requests")
  ) {
    return {
      code: "SYSTEM-001",
      message: "Too many attempts",
      details: "Please wait a moment before trying again.",
    };
  }

  // Token expired
  if (
    lowerMessage.includes("expired") ||
    lowerMessage.includes("token")
  ) {
    return {
      code: "AUTH-002",
      message: "Session expired",
      details: "Your session has expired. Please sign in again.",
    };
  }

  // Default to system error
  return {
    code: "SYSTEM-001",
    message: "An error occurred",
    details: errorMessage || "Please try again later.",
  };
}

/**
 * Formats an error for display in the UI with code prefix
 */
export function formatErrorForDisplay(error: {
  code: string;
  message: string;
  details: string | Record<string, string> | null;
}): string {
  const detailsText = typeof error.details === "string" 
    ? error.details 
    : error.details 
      ? Object.values(error.details).join(", ") 
      : "";
  
  return `[${error.code}] ${error.message}${detailsText ? `: ${detailsText}` : ""}`;
}
