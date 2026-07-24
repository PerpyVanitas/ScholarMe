"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import spec from "@/docs/openapi.json";

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8 ml-4">ScholarMe API Documentation</h1>
        <SwaggerUI spec={spec} />
      </div>
    </div>
  );
}
