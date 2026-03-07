/**
 * ScholarMe Error Codes - Based on SDD Section 5.3
 * Comprehensive error handling covering industry-standard scenarios
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
  // ============================================
  // AUTH-001: Invalid Credentials & Authentication Failures
  // ============================================
  AUTH_001_INVALID_CREDENTIALS: {
    code: "AUTH-001",
    message: "Invalid credentials",
    details: "Email or password is incorrect. Please check your credentials and try again.",
  },
  AUTH_001_INVALID_CARD: {
    code: "AUTH-001",
    message: "Invalid card credentials",
    details: "Card ID or PIN is incorrect. Please verify and try again.",
  },
  AUTH_001_INVALID_PIN: {
    code: "AUTH-001",
    message: "Incorrect PIN",
    details: "The PIN entered does not match our records.",
  },
  AUTH_001_ACCOUNT_LOCKED: {
    code: "AUTH-001",
    message: "Account locked",
    details: "Your account has been locked due to too many failed login attempts. Please try again later.",
  },
  AUTH_001_ACCOUNT_DISABLED: {
    code: "AUTH-001",
    message: "Account disabled",
    details: "Your account has been disabled. Please contact support.",
  },
  AUTH_001_ACCOUNT_SUSPENDED: {
    code: "AUTH-001",
    message: "Account suspended",
    details: "Your account has been suspended. Please contact support for assistance.",
  },
  AUTH_001_EMAIL_NOT_VERIFIED: {
    code: "AUTH-001",
    message: "Email not verified",
    details: "Please verify your email before signing in. Check your inbox for a verification link.",
  },
  AUTH_001_MFA_REQUIRED: {
    code: "AUTH-001",
    message: "Multi-factor authentication required",
    details: "Please enter the verification code sent to your email.",
  },
  AUTH_001_MFA_FAILED: {
    code: "AUTH-001",
    message: "Invalid verification code",
    details: "The verification code you entered is incorrect or has expired.",
  },
  AUTH_001_TOO_MANY_LOGIN_ATTEMPTS: {
    code: "AUTH-001",
    message: "Too many login attempts",
    details: "Your account is temporarily locked due to multiple failed login attempts. Please try again in 15 minutes.",
  },

  // ============================================
  // AUTH-002: Token & Session Expiration
  // ============================================
  AUTH_002_TOKEN_EXPIRED: {
    code: "AUTH-002",
    message: "Session expired",
    details: "Your session has expired. Please sign in again.",
  },
  AUTH_002_INVALID_TOKEN: {
    code: "AUTH-002",
    message: "Invalid or expired token",
    details: "Your authentication token is invalid. Please sign in again.",
  },
  AUTH_002_SESSION_EXPIRED: {
    code: "AUTH-002",
    message: "Your session has ended",
    details: "You have been logged out due to inactivity. Please sign in again to continue.",
  },
  AUTH_002_REFRESH_TOKEN_EXPIRED: {
    code: "AUTH-002",
    message: "Refresh token expired",
    details: "Your login session has fully expired. Please sign in again.",
  },

  // ============================================
  // AUTH-003: Authorization & Permissions
  // ============================================
  AUTH_003_FORBIDDEN: {
    code: "AUTH-003",
    message: "Access denied",
    details: "You do not have permission to access this resource.",
  },
  AUTH_003_INSUFFICIENT_PERMISSIONS: {
    code: "AUTH-003",
    message: "Insufficient permissions",
    details: "Your account does not have the required permissions for this action.",
  },
  AUTH_003_ROLE_NOT_PERMITTED: {
    code: "AUTH-003",
    message: "Role not permitted",
    details: "Your account role does not allow access to this feature.",
  },
  AUTH_003_SUBSCRIPTION_REQUIRED: {
    code: "AUTH-003",
    message: "Subscription required",
    details: "This feature requires an active subscription. Please upgrade your account.",
  },
  AUTH_003_ADMIN_ONLY: {
    code: "AUTH-003",
    message: "Admin access required",
    details: "This action can only be performed by administrators.",
  },

  // ============================================
  // VALID-001: Validation Errors
  // ============================================
  VALID_001_GENERAL: {
    code: "VALID-001",
    message: "Validation failed",
    details: null,
  },
  VALID_001_EMAIL_EXISTS: {
    code: "VALID-001",
    message: "Email already registered",
    details: "An account with this email already exists. Please sign in instead.",
  },
  VALID_001_USERNAME_EXISTS: {
    code: "VALID-001",
    message: "Username already taken",
    details: "This username is not available. Please choose a different one.",
  },
  VALID_001_INVALID_EMAIL: {
    code: "VALID-001",
    message: "Invalid email format",
    details: "Please enter a valid email address (e.g., user@example.com).",
  },
  VALID_001_INVALID_PHONE: {
    code: "VALID-001",
    message: "Invalid phone number",
    details: "Please enter a valid phone number in the format +1(123)456-7890.",
  },
  VALID_001_PASSWORD_WEAK: {
    code: "VALID-001",
    message: "Password is too weak",
    details: "Password must be at least 8 characters and contain uppercase, lowercase, numbers, and special characters.",
  },
  VALID_001_PASSWORD_SHORT: {
    code: "VALID-001",
    message: "Password too short",
    details: "Password must be at least 8 characters long.",
  },
  VALID_001_PASSWORDS_DONT_MATCH: {
    code: "VALID-001",
    message: "Passwords do not match",
    details: "The password and confirm password fields must be identical.",
  },
  VALID_001_MISSING_REQUIRED_FIELD: {
    code: "VALID-001",
    message: "Missing required field",
    details: null,
  },
  VALID_001_INVALID_NAME_FORMAT: {
    code: "VALID-001",
    message: "Invalid name format",
    details: "Name must be between 2 and 50 characters and contain only letters, spaces, and hyphens.",
  },
  VALID_001_INVALID_CARD_ID: {
    code: "VALID-001",
    message: "Invalid card ID format",
    details: "Please enter a valid card ID.",
  },
  VALID_001_INVALID_DATE: {
    code: "VALID-001",
    message: "Invalid date",
    details: "Please enter a valid date.",
  },
  VALID_001_AGE_RESTRICTION: {
    code: "VALID-001",
    message: "Age requirement not met",
    details: "You must be at least 13 years old to create an account.",
  },
  VALID_001_TERMS_NOT_ACCEPTED: {
    code: "VALID-001",
    message: "Terms not accepted",
    details: "You must accept the terms and conditions to continue.",
  },
  VALID_001_FILE_TOO_LARGE: {
    code: "VALID-001",
    message: "File too large",
    details: "The maximum file size is 10MB. Please choose a smaller file.",
  },
  VALID_001_INVALID_FILE_TYPE: {
    code: "VALID-001",
    message: "Invalid file type",
    details: "Only image files (JPG, PNG, GIF, WebP) are allowed.",
  },

  // ============================================
  // DB-001: Database & Resource Errors
  // ============================================
  DB_001_NOT_FOUND: {
    code: "DB-001",
    message: "Resource not found",
    details: "The requested resource does not exist.",
  },
  DB_001_USER_NOT_FOUND: {
    code: "DB-001",
    message: "User not found",
    details: "No account exists with the provided information.",
  },
  DB_001_PROFILE_NOT_FOUND: {
    code: "DB-001",
    message: "Profile not found",
    details: "User profile does not exist. Please complete profile setup.",
  },
  DB_001_SESSION_NOT_FOUND: {
    code: "DB-001",
    message: "Session not found",
    details: "The requested session does not exist.",
  },
  DB_001_TUTOR_NOT_FOUND: {
    code: "DB-001",
    message: "Tutor not found",
    details: "The requested tutor profile does not exist.",
  },
  DB_001_COURSE_NOT_FOUND: {
    code: "DB-001",
    message: "Course not found",
    details: "The requested course does not exist.",
  },
  DB_001_DUPLICATE_RECORD: {
    code: "DB-001",
    message: "Duplicate record",
    details: "This record already exists in the system.",
  },
  DB_001_DATA_INTEGRITY_ERROR: {
    code: "DB-001",
    message: "Data integrity error",
    details: "There was an issue saving your data. Please try again.",
  },

  // ============================================
  // BUS-001: Business Logic - Scheduling Conflicts
  // ============================================
  BUS_001_SCHEDULING_CONFLICT: {
    code: "BUS-001",
    message: "Scheduling conflict",
    details: "The requested time slot is not available due to a conflict.",
  },
  BUS_001_NO_AVAILABILITY: {
    code: "BUS-001",
    message: "No availability",
    details: "The tutor has no available slots during the requested time.",
  },
  BUS_001_SLOT_UNAVAILABLE: {
    code: "BUS-001",
    message: "Slot not available",
    details: "This time slot has already been booked. Please choose another time.",
  },
  BUS_001_TUTOR_UNAVAILABLE: {
    code: "BUS-001",
    message: "Tutor unavailable",
    details: "This tutor is not available at the requested time.",
  },
  BUS_001_LEARNER_UNAVAILABLE: {
    code: "BUS-001",
    message: "You are unavailable",
    details: "You have another session scheduled at this time.",
  },
  BUS_001_BOOKING_IN_PAST: {
    code: "BUS-001",
    message: "Cannot book in the past",
    details: "Please select a date and time in the future.",
  },
  BUS_001_MINIMUM_NOTICE_REQUIRED: {
    code: "BUS-001",
    message: "Insufficient notice",
    details: "Sessions must be booked at least 24 hours in advance.",
  },
  BUS_001_MAXIMUM_SESSIONS_REACHED: {
    code: "BUS-001",
    message: "Maximum sessions reached",
    details: "You have reached the maximum number of sessions for this period.",
  },
  BUS_001_SESSION_CANCELLED: {
    code: "BUS-001",
    message: "Session cancelled",
    details: "This session has been cancelled.",
  },
  BUS_001_CANNOT_MODIFY_SESSION: {
    code: "BUS-001",
    message: "Cannot modify session",
    details: "Sessions cannot be modified within 24 hours of the start time.",
  },

  // ============================================
  // BUS-002: Business Logic - Card/Scan Issues
  // ============================================
  BUS_002_SCAN_FAILURE: {
    code: "BUS-002",
    message: "Card scan failed",
    details: "Failed to scan the card. Please try again.",
  },
  BUS_002_INVALID_CARD_STATE: {
    code: "BUS-002",
    message: "Invalid card state",
    details: "The card is in an invalid state for this operation.",
  },
  BUS_002_CARD_EXPIRED: {
    code: "BUS-002",
    message: "Card expired",
    details: "This card has expired. Please obtain a new card.",
  },
  BUS_002_CARD_BLOCKED: {
    code: "BUS-002",
    message: "Card blocked",
    details: "This card has been blocked. Please contact support.",
  },
  BUS_002_CARD_NOT_ACTIVATED: {
    code: "BUS-002",
    message: "Card not activated",
    details: "This card has not been activated yet.",
  },

  // ============================================
  // SYSTEM-001: System & Server Errors
  // ============================================
  SYSTEM_001_INTERNAL_ERROR: {
    code: "SYSTEM-001",
    message: "Internal server error",
    details: "An unexpected error occurred. Please try again later.",
  },
  SYSTEM_001_DATABASE_ERROR: {
    code: "SYSTEM-001",
    message: "Database error",
    details: "Failed to process your request due to a database issue. Please try again.",
  },
  SYSTEM_001_SERVICE_UNAVAILABLE: {
    code: "SYSTEM-001",
    message: "Service unavailable",
    details: "The service is temporarily unavailable. Please try again later.",
  },
  SYSTEM_001_REQUEST_TIMEOUT: {
    code: "SYSTEM-001",
    message: "Request timeout",
    details: "Your request took too long to process. Please try again.",
  },
  SYSTEM_001_RATE_LIMITED: {
    code: "SYSTEM-001",
    message: "Too many requests",
    details: "You have made too many requests. Please wait a moment before trying again.",
  },
  SYSTEM_001_INVALID_REQUEST: {
    code: "SYSTEM-001",
    message: "Invalid request",
    details: "The request format is invalid. Please check and try again.",
  },
  SYSTEM_001_FILE_UPLOAD_ERROR: {
    code: "SYSTEM-001",
    message: "File upload failed",
    details: "Failed to upload the file. Please try again.",
  },
  SYSTEM_001_EXTERNAL_API_ERROR: {
    code: "SYSTEM-001",
    message: "External service error",
    details: "An external service is currently unavailable. Please try again later.",
  },
  SYSTEM_001_PAYMENT_ERROR: {
    code: "SYSTEM-001",
    message: "Payment processing error",
    details: "Failed to process payment. Please try again or contact support.",
  },
  SYSTEM_001_EMAIL_SEND_ERROR: {
    code: "SYSTEM-001",
    message: "Failed to send email",
    details: "Could not send email. Please try again later.",
  },
  SYSTEM_001_UNKNOWN_ERROR: {
    code: "SYSTEM-001",
    message: "Unknown error",
    details: "An unexpected error occurred. Please try again later or contact support.",
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
 * Covers comprehensive industry-standard authentication scenarios
 */
export function mapSupabaseErrorToCode(errorMessage: string): {
  code: string;
  message: string;
  details: string;
} {
  const lowerMessage = errorMessage.toLowerCase();

  // ============================================
  // AUTH-001: Invalid Credentials
  // ============================================
  if (
    lowerMessage.includes("invalid login credentials") ||
    lowerMessage.includes("invalid email or password")
  ) {
    return {
      code: "AUTH-001",
      message: "Invalid credentials",
      details: "Email or password is incorrect. Please check your credentials and try again.",
    };
  }

  if (lowerMessage.includes("email not confirmed")) {
    return {
      code: "AUTH-001",
      message: "Email not verified",
      details: "Please verify your email before signing in. Check your inbox for a verification link.",
    };
  }

  if (lowerMessage.includes("account locked") || lowerMessage.includes("too many login attempts")) {
    return {
      code: "AUTH-001",
      message: "Account locked",
      details: "Your account has been locked due to too many failed login attempts. Please try again later.",
    };
  }

  if (lowerMessage.includes("account disabled")) {
    return {
      code: "AUTH-001",
      message: "Account disabled",
      details: "Your account has been disabled. Please contact support.",
    };
  }

  if (lowerMessage.includes("account suspended")) {
    return {
      code: "AUTH-001",
      message: "Account suspended",
      details: "Your account has been suspended. Please contact support for assistance.",
    };
  }

  if (lowerMessage.includes("mfa") || lowerMessage.includes("multi-factor")) {
    return {
      code: "AUTH-001",
      message: "Multi-factor authentication required",
      details: "Please enter the verification code sent to your email.",
    };
  }

  // ============================================
  // AUTH-002: Token/Session Expiration
  // ============================================
  if (lowerMessage.includes("token") && lowerMessage.includes("expired")) {
    return {
      code: "AUTH-002",
      message: "Session expired",
      details: "Your session has expired. Please sign in again.",
    };
  }

  if (lowerMessage.includes("invalid") && lowerMessage.includes("token")) {
    return {
      code: "AUTH-002",
      message: "Invalid or expired token",
      details: "Your authentication token is invalid. Please sign in again.",
    };
  }

  if (lowerMessage.includes("session") && lowerMessage.includes("expired")) {
    return {
      code: "AUTH-002",
      message: "Your session has ended",
      details: "You have been logged out due to inactivity. Please sign in again to continue.",
    };
  }

  // ============================================
  // AUTH-003: Authorization
  // ============================================
  if (lowerMessage.includes("not authorized") || lowerMessage.includes("permission")) {
    return {
      code: "AUTH-003",
      message: "Access denied",
      details: "You do not have permission to access this resource.",
    };
  }

  if (lowerMessage.includes("forbidden")) {
    return {
      code: "AUTH-003",
      message: "Forbidden",
      details: "You do not have permission to perform this action.",
    };
  }

  // ============================================
  // VALID-001: Validation Errors
  // ============================================

  // Email already exists
  if (
    lowerMessage.includes("already registered") ||
    lowerMessage.includes("user already exists") ||
    lowerMessage.includes("duplicate key") ||
    lowerMessage.includes("duplicate") ||
    lowerMessage.includes("email already")
  ) {
    return {
      code: "VALID-001",
      message: "Email already registered",
      details: "An account with this email already exists. Please sign in instead.",
    };
  }

  // Password validation
  if (lowerMessage.includes("password")) {
    if (
      lowerMessage.includes("weak") ||
      lowerMessage.includes("strength")
    ) {
      return {
        code: "VALID-001",
        message: "Password is too weak",
        details: "Password must be at least 8 characters and contain uppercase, lowercase, numbers, and special characters.",
      };
    }

    if (
      lowerMessage.includes("short") ||
      lowerMessage.includes("at least") ||
      lowerMessage.includes("minimum")
    ) {
      return {
        code: "VALID-001",
        message: "Password too short",
        details: "Password must be at least 8 characters long.",
      };
    }

    if (lowerMessage.includes("confirm") || lowerMessage.includes("match")) {
      return {
        code: "VALID-001",
        message: "Passwords do not match",
        details: "The password and confirm password fields must be identical.",
      };
    }
  }

  // Email format
  if (
    lowerMessage.includes("invalid email") ||
    lowerMessage.includes("invalid format") ||
    lowerMessage.includes("email")
  ) {
    return {
      code: "VALID-001",
      message: "Invalid email format",
      details: "Please enter a valid email address (e.g., user@example.com).",
    };
  }

  // Username exists
  if (lowerMessage.includes("username") && lowerMessage.includes("exists")) {
    return {
      code: "VALID-001",
      message: "Username already taken",
      details: "This username is not available. Please choose a different one.",
    };
  }

  // Phone validation
  if (lowerMessage.includes("phone")) {
    return {
      code: "VALID-001",
      message: "Invalid phone number",
      details: "Please enter a valid phone number in the format +1(123)456-7890.",
    };
  }

  // Required fields
  if (
    lowerMessage.includes("required") ||
    lowerMessage.includes("missing")
  ) {
    return {
      code: "VALID-001",
      message: "Missing required field",
      details: "Please fill in all required fields.",
    };
  }

  // ============================================
  // DB-001: Database & Resource Errors
  // ============================================

  // User not found
  if (
    lowerMessage.includes("user not found") ||
    lowerMessage.includes("no user found") ||
    lowerMessage.includes("user does not exist")
  ) {
    return {
      code: "DB-001",
      message: "User not found",
      details: "No account exists with the provided information.",
    };
  }

  // Profile not found
  if (lowerMessage.includes("profile") && lowerMessage.includes("not found")) {
    return {
      code: "DB-001",
      message: "Profile not found",
      details: "User profile does not exist. Please complete profile setup.",
    };
  }

  // Generic not found
  if (lowerMessage.includes("not found")) {
    return {
      code: "DB-001",
      message: "Resource not found",
      details: "The requested resource does not exist.",
    };
  }

  // Data integrity
  if (
    lowerMessage.includes("integrity") ||
    lowerMessage.includes("constraint")
  ) {
    return {
      code: "DB-001",
      message: "Data integrity error",
      details: "There was an issue saving your data. Please try again.",
    };
  }

  // ============================================
  // BUS-001: Business Logic - Scheduling
  // ============================================

  if (lowerMessage.includes("conflict") || lowerMessage.includes("unavailable")) {
    return {
      code: "BUS-001",
      message: "Scheduling conflict",
      details: "The requested time slot is not available due to a conflict.",
    };
  }

  if (lowerMessage.includes("slot")) {
    return {
      code: "BUS-001",
      message: "Slot not available",
      details: "This time slot has already been booked. Please choose another time.",
    };
  }

  if (lowerMessage.includes("booking") && lowerMessage.includes("past")) {
    return {
      code: "BUS-001",
      message: "Cannot book in the past",
      details: "Please select a date and time in the future.",
    };
  }

  // ============================================
  // BUS-002: Business Logic - Card/Scan
  // ============================================

  if (lowerMessage.includes("scan") || lowerMessage.includes("card")) {
    if (lowerMessage.includes("failed")) {
      return {
        code: "BUS-002",
        message: "Card scan failed",
        details: "Failed to scan the card. Please try again.",
      };
    }

    if (lowerMessage.includes("expired")) {
      return {
        code: "BUS-002",
        message: "Card expired",
        details: "This card has expired. Please obtain a new card.",
      };
    }

    if (lowerMessage.includes("blocked")) {
      return {
        code: "BUS-002",
        message: "Card blocked",
        details: "This card has been blocked. Please contact support.",
      };
    }
  }

  // ============================================
  // SYSTEM-001: System Errors
  // ============================================

  if (lowerMessage.includes("rate limit")) {
    return {
      code: "SYSTEM-001",
      message: "Too many requests",
      details: "You have made too many requests. Please wait a moment before trying again.",
    };
  }

  if (lowerMessage.includes("timeout")) {
    return {
      code: "SYSTEM-001",
      message: "Request timeout",
      details: "Your request took too long to process. Please try again.",
    };
  }

  if (
    lowerMessage.includes("database") ||
    lowerMessage.includes("connection")
  ) {
    return {
      code: "SYSTEM-001",
      message: "Database error",
      details: "Failed to process your request due to a database issue. Please try again.",
    };
  }

  if (
    lowerMessage.includes("service unavailable") ||
    lowerMessage.includes("temporarily unavailable")
  ) {
    return {
      code: "SYSTEM-001",
      message: "Service unavailable",
      details: "The service is temporarily unavailable. Please try again later.",
    };
  }

  if (lowerMessage.includes("internal server error")) {
    return {
      code: "SYSTEM-001",
      message: "Internal server error",
      details: "An unexpected error occurred. Please try again later.",
    };
  }

  // Default to system error
  return {
    code: "SYSTEM-001",
    message: "An error occurred",
    details: errorMessage || "Please try again later or contact support.",
  };
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
 * Formats an error for display in the UI with code prefix and details
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
