import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import * as fs from "fs";

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

// Example registration (P9-1 scaffolding)
// This serves as the foundation for the ScholarMe API documentation.

const HealthSchema = {
  type: "object",
  properties: {
    status: { type: "string" },
    timestamp: { type: "string" },
    build: { type: "string" },
  }
};

const UserSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    role: { type: "string" },
    email: { type: "string", format: "email" },
  }
};

const TutorSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    user_id: { type: "string", format: "uuid" },
    rating: { type: "number" },
    total_ratings: { type: "integer" },
  }
};

const SessionSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    tutor_id: { type: "string", format: "uuid" },
    learner_id: { type: "string", format: "uuid" },
    status: { type: "string" },
    scheduled_date: { type: "string", format: "date" },
  }
};

registry.registerPath({
  method: "get",
  path: "/api/health",
  description: "Check system health and database connectivity",
  responses: {
    200: {
      description: "Object with health status",
      content: { "application/json": { schema: HealthSchema as never } },
    },
    503: { description: "Service unavailable" },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/users",
  description: "Get all users (Admin only)",
  responses: {
    200: {
      description: "Array of users",
      content: { "application/json": { schema: { type: "array", items: UserSchema as never } } },
    }
  }
});

registry.registerPath({
  method: "get",
  path: "/api/tutors",
  description: "Get all tutors",
  responses: {
    200: {
      description: "Array of tutors",
      content: { "application/json": { schema: { type: "array", items: TutorSchema as never } } },
    }
  }
});

registry.registerPath({
  method: "get",
  path: "/api/sessions",
  description: "Get sessions for the current user",
  responses: {
    200: {
      description: "Array of sessions",
      content: { "application/json": { schema: { type: "array", items: SessionSchema as never } } },
    }
  }
});

function generateOpenAPI() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  const document = generator.generateDocument({
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "ScholarMe API",
      description: "Internal and external APIs for ScholarMe",
    },
    servers: [{ url: "https://scholarme.vercel.app" }],
  });

  fs.writeFileSync(
    "docs/openapi.json",
    JSON.stringify(document, null, 2),
    "utf-8"
  );
  console.log("OpenAPI spec written to docs/openapi.json");
}

// Execute the generator
generateOpenAPI();
