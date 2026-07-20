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

registry.registerPath({
  method: "get",
  path: "/api/health",
  description: "Check system health and database connectivity",
  responses: {
    200: {
      description: "Object with health status",
      content: {
        "application/json": {
          schema: HealthSchema as any,
        },
      },
    },
    503: {
      description: "Service unavailable",
    },
  },
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

if (require.main === module) {
  generateOpenAPI();
}
