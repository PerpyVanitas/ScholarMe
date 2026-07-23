import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "@/app/api/admin/migrations/execute/route";
import { NextRequest } from "next/server";

describe("Migration API Route", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
  });

  it("P1-21: Returns 404 in production environment", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";

    const req = new NextRequest(
      "http://localhost/api/admin/migrations/execute",
      {
        method: "POST",
        headers: {
          authorization: "Bearer MOCK_TOKEN",
        },
      },
    );

    const res = await POST(req);

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Migration API is disabled in production");
  });
});
