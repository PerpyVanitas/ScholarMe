import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";
import * as fs from "fs";

/**
 * ScholarMe OpenAPI Spec Generator
 * Generates docs/openapi.json for internal and external API consumers.
 * Run via: `pnpm run openapi`
 */
export const registry = new OpenAPIRegistry();

// --- OPENAPI SCHEMAS ---

const HealthSchema = {
  type: "object",
  properties: {
    status: { type: "string", example: "ok" },
    timestamp: { type: "string", example: "2026-07-22T12:00:00.000Z" },
    build: { type: "string", example: "1.0.0" },
  },
};

const UserSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    full_name: { type: "string" },
    email: { type: "string", format: "email" },
    role: { type: "string" },
    avatar_url: { type: "string", format: "uri" },
  },
};

const CardLoginSchema = {
  type: "object",
  properties: {
    cardId: { type: "string", example: "CARD-12345" },
    sig: { type: "string", example: "a3f5..." },
    pin: { type: "string", example: "1234" },
  },
};

const RegisterCardSchema = {
  type: "object",
  properties: {
    userId: { type: "string", format: "uuid" },
    cardId: { type: "string", example: "CARD-12345" },
    pin: { type: "string", minLength: 4, maxLength: 4 },
  },
};

const TutorSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    user_id: { type: "string", format: "uuid" },
    rating: { type: "number", minimum: 0, maximum: 5 },
    total_ratings: { type: "integer" },
    is_available: { type: "boolean" },
    hourly_rate: { type: "number" },
  },
};

const SessionSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    tutor_id: { type: "string", format: "uuid" },
    learner_id: { type: "string", format: "uuid" },
    subject: { type: "string" },
    status: { type: "string", enum: ["pending", "confirmed", "completed", "cancelled", "no_show"] },
    scheduled_date: { type: "string", format: "date" },
    start_time: { type: "string" },
    end_time: { type: "string" },
    meeting_link: { type: "string", format: "uri" },
  },
};

const BudgetRequestSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    title: { type: "string" },
    amount: { type: "number", minimum: 0 },
    purpose: { type: "string" },
    status: { type: "string", enum: ["pending", "finance_approved", "president_approved", "rejected", "disbursed"] },
    submitted_by: { type: "string", format: "uuid" },
  },
};

const PettyCashSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    amount: { type: "number", minimum: 0 },
    purpose: { type: "string" },
    custodian_id: { type: "string", format: "uuid" },
    receipt_url: { type: "string", format: "uri" },
  },
};

const LiquidationSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    budget_request_id: { type: "string", format: "uuid" },
    total_spent: { type: "number", minimum: 0 },
    receipt_urls: { type: "array", items: { type: "string", format: "uri" } },
    status: { type: "string", enum: ["pending", "approved", "rejected"] },
    is_late: { type: "boolean" },
  },
};

// --- PATH REGISTRATIONS ---

// 1. System Health
registry.registerPath({
  method: "get",
  path: "/api/health",
  description: "Check system health and database connectivity",
  responses: {
    200: {
      description: "Health status details",
      content: { "application/json": { schema: HealthSchema as never } },
    },
    503: { description: "Service unavailable" },
  },
});

// 2. Authentication APIs (/api/auth/*)
registry.registerPath({
  method: "post",
  path: "/api/auth/card-login",
  description: "Authenticate user via HMAC-SHA256 encrypted QR ID card scan",
  request: {
    body: {
      content: { "application/json": { schema: CardLoginSchema as never } },
    },
  },
  responses: {
    200: { description: "Card login successful and session established" },
    400: { description: "Invalid payload or signature format" },
    401: { description: "Invalid HMAC signature or PIN verification failed" },
    429: { description: "Rate limit exceeded (too many card login attempts)" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/register-card",
  description: "Register or link an HMAC-signed QR ID card to a user profile (Admin/Officer only)",
  request: {
    body: {
      content: { "application/json": { schema: RegisterCardSchema as never } },
    },
  },
  responses: {
    200: { description: "Card successfully linked to profile" },
    403: { description: "Forbidden: Officer or Admin privileges required" },
  },
});

// 3. Tutors APIs (/api/tutors/*)
registry.registerPath({
  method: "get",
  path: "/api/tutors",
  description: "List all active available tutors with profile metadata",
  responses: {
    200: {
      description: "Array of available tutors",
      content: { "application/json": { schema: { type: "array", items: TutorSchema as never } } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/tutors/{id}",
  description: "Retrieve detailed profile, ratings, and availability for a specific tutor",
  responses: {
    200: {
      description: "Tutor details object",
      content: { "application/json": { schema: TutorSchema as never } },
    },
    404: { description: "Tutor not found" },
  },
});

// 4. Sessions APIs (/api/sessions/*)
registry.registerPath({
  method: "get",
  path: "/api/sessions",
  description: "Get all tutoring sessions for the authenticated user",
  responses: {
    200: {
      description: "List of user sessions",
      content: { "application/json": { schema: { type: "array", items: SessionSchema as never } } },
    },
    401: { description: "Unauthorized" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/sessions",
  description: "Book a new tutoring session",
  responses: {
    201: { description: "Session booked successfully" },
    400: { description: "Time slot unavailable or validation error" },
    401: { description: "Unauthorized" },
  },
});

registry.registerPath({
  method: "put",
  path: "/api/sessions/{id}/status",
  description: "Update tutoring session status (confirm, complete, cancel, no_show)",
  responses: {
    200: { description: "Status updated successfully" },
    400: { description: "Invalid status transition" },
    403: { description: "Forbidden" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/sessions/{id}/join",
  description: "Generate video meeting tokens and track learner/tutor attendance",
  responses: {
    200: { description: "Meeting room details and tokens" },
    403: { description: "Not a participant in this session" },
  },
});

// 5. Finance APIs (/api/finance/*)
registry.registerPath({
  method: "get",
  path: "/api/finance/budget-requests",
  description: "Retrieve organizational budget requests (Finance review roles)",
  responses: {
    200: {
      description: "Array of budget requests",
      content: { "application/json": { schema: { type: "array", items: BudgetRequestSchema as never } } },
    },
    403: { description: "Forbidden" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/finance/budget-requests",
  description: "Submit a new organizational budget request",
  responses: {
    201: { description: "Budget request submitted" },
    400: { description: "Blocked due to outstanding late liquidations or invalid amount" },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/finance/petty-cash",
  description: "Retrieve petty cash disbursements and log history",
  responses: {
    200: {
      description: "Array of petty cash entries",
      content: { "application/json": { schema: { type: "array", items: PettyCashSchema as never } } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/finance/liquidations",
  description: "Retrieve liquidation reports and receipt attachments",
  responses: {
    200: {
      description: "Array of liquidations",
      content: { "application/json": { schema: { type: "array", items: LiquidationSchema as never } } },
    },
  },
});

function generateOpenAPI() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  const document = generator.generateDocument({
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "ScholarMe API Specification",
      description: "Authoritative OpenAPI 3.0 specification for ScholarMe core API route groups.",
    },
    servers: [{ url: "https://scholarme.vercel.app" }],
  });

  fs.writeFileSync("docs/openapi.json", JSON.stringify(document, null, 2), "utf-8");
  console.log("OpenAPI spec successfully written to docs/openapi.json");
}

generateOpenAPI();
