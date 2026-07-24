import { OpenAPIRegistry, OpenApiGeneratorV3, extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import * as fs from "fs";

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

// Define Zod Schemas
const HealthSchema = z.object({
  status: z.string(),
  timestamp: z.string(),
  build: z.string(),
}).openapi("Health", {
  example: {
    status: "ok",
    timestamp: "2026-07-22T12:00:00.000Z",
    build: "1.0.0"
  }
});

const UserSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string(),
  email: z.string().email(),
  role: z.string(),
  avatar_url: z.string().url().optional(),
}).openapi("User");

const CardLoginSchema = z.object({
  cardId: z.string(),
  sig: z.string(),
  pin: z.string(),
}).openapi("CardLogin", {
  example: {
    cardId: "CARD-12345",
    sig: "a3f5...",
    pin: "1234"
  }
});

const RegisterCardSchema = z.object({
  userId: z.string().uuid(),
  cardId: z.string(),
  pin: z.string().min(4).max(4),
}).openapi("RegisterCard", {
  example: {
    userId: "123e4567-e89b-12d3-a456-426614174000",
    cardId: "CARD-12345",
    pin: "1234"
  }
});

const TutorSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  rating: z.number().min(0).max(5),
  total_ratings: z.number().int(),
  is_available: z.boolean(),
  hourly_rate: z.number(),
}).openapi("Tutor");

const SessionSchema = z.object({
  id: z.string().uuid(),
  tutor_id: z.string().uuid(),
  learner_id: z.string().uuid(),
  subject: z.string(),
  status: z.enum(["pending", "confirmed", "completed", "cancelled", "no_show"]),
  scheduled_date: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  meeting_link: z.string().url().optional(),
}).openapi("Session");

const BudgetRequestSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  amount: z.number().min(0),
  purpose: z.string(),
  status: z.enum(["pending", "finance_approved", "president_approved", "rejected", "disbursed"]),
  submitted_by: z.string().uuid(),
}).openapi("BudgetRequest");

const PettyCashSchema = z.object({
  id: z.string().uuid(),
  amount: z.number().min(0),
  purpose: z.string(),
  custodian_id: z.string().uuid(),
  receipt_url: z.string().url().optional(),
}).openapi("PettyCash");

const LiquidationSchema = z.object({
  id: z.string().uuid(),
  budget_request_id: z.string().uuid(),
  total_spent: z.number().min(0),
  receipt_urls: z.array(z.string().url()),
  status: z.enum(["pending", "approved", "rejected"]),
  is_late: z.boolean(),
}).openapi("Liquidation");

// Register schemas in OpenAPI registry
registry.register("Health", HealthSchema);
registry.register("User", UserSchema);
registry.register("CardLogin", CardLoginSchema);
registry.register("RegisterCard", RegisterCardSchema);
registry.register("Tutor", TutorSchema);
registry.register("Session", SessionSchema);
registry.register("BudgetRequest", BudgetRequestSchema);
registry.register("PettyCash", PettyCashSchema);
registry.register("Liquidation", LiquidationSchema);

// --- PATH REGISTRATIONS ---

registry.registerPath({
  method: "get",
  path: "/api/v1/health",
  description: "Check system health and database connectivity",
  responses: {
    200: {
      description: "Health status details",
      content: { "application/json": { schema: HealthSchema } },
    },
    503: { description: "Service unavailable" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/auth/card-login",
  description: "Authenticate user via HMAC-SHA256 encrypted QR ID card scan",
  request: { body: { content: { "application/json": { schema: CardLoginSchema } } } },
  responses: {
    200: { description: "Card login successful and session established" },
    400: { description: "Invalid payload or signature format" },
    401: { description: "Invalid HMAC signature or PIN verification failed" },
    429: { description: "Rate limit exceeded (too many card login attempts)" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/auth/register-card",
  description: "Register or link an HMAC-signed QR ID card to a user profile",
  request: { body: { content: { "application/json": { schema: RegisterCardSchema } } } },
  responses: {
    200: { description: "Card successfully linked to profile" },
    403: { description: "Forbidden" },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/tutors",
  description: "List all active available tutors",
  responses: {
    200: {
      description: "Array of available tutors",
      content: { "application/json": { schema: z.array(TutorSchema) } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/tutors/{id}",
  description: "Retrieve specific tutor",
  responses: {
    200: {
      description: "Tutor details object",
      content: { "application/json": { schema: TutorSchema } },
    },
    404: { description: "Tutor not found" },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/sessions",
  description: "Get all tutoring sessions for the authenticated user",
  responses: {
    200: {
      description: "List of user sessions",
      content: { "application/json": { schema: z.array(SessionSchema) } },
    },
    401: { description: "Unauthorized" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/sessions",
  description: "Book a new tutoring session",
  responses: {
    201: { description: "Session booked successfully" },
    400: { description: "Time slot unavailable or validation error" },
    401: { description: "Unauthorized" },
  },
});

registry.registerPath({
  method: "put",
  path: "/api/v1/sessions/{id}/status",
  description: "Update tutoring session status",
  responses: {
    200: { description: "Status updated successfully" },
    400: { description: "Invalid status transition" },
    403: { description: "Forbidden" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/sessions/{id}/join",
  description: "Generate video meeting tokens",
  responses: {
    200: { description: "Meeting room details and tokens" },
    403: { description: "Not a participant in this session" },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/finance/budget-requests",
  description: "Retrieve organizational budget requests",
  responses: {
    200: {
      description: "Array of budget requests",
      content: { "application/json": { schema: z.array(BudgetRequestSchema) } },
    },
    403: { description: "Forbidden" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/finance/budget-requests",
  description: "Submit a new organizational budget request",
  responses: {
    201: { description: "Budget request submitted" },
    400: { description: "Blocked due to outstanding late liquidations or invalid amount" },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/finance/petty-cash",
  description: "Retrieve petty cash disbursements",
  responses: {
    200: {
      description: "Array of petty cash entries",
      content: { "application/json": { schema: z.array(PettyCashSchema) } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/finance/liquidations",
  description: "Retrieve liquidation reports",
  responses: {
    200: {
      description: "Array of liquidations",
      content: { "application/json": { schema: z.array(LiquidationSchema) } },
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
      description: "Authoritative OpenAPI 3.0 specification generated from Zod schemas.",
    },
    servers: [{ url: "https://scholarme.vercel.app" }],
  });

  fs.writeFileSync("docs/openapi.json", JSON.stringify(document, null, 2), "utf-8");
  console.log("OpenAPI spec successfully written to docs/openapi.json");
}

generateOpenAPI();
