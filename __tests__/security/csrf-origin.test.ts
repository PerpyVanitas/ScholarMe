import { describe, it, expect } from "vitest";
// @ts-expect-error -- proxy export is not typed as middleware, aliased for test clarity
import { proxy as middleware } from "@/proxy";
import { NextRequest } from "next/server";

describe("CSRF / Origin Validation", () => {
  it("P1-12: State-mutating POST without correct Origin/Referer header is rejected", async () => {
    const req = new NextRequest("http://localhost/api/account/password", {
      method: "POST",
      headers: {
        // No origin
        // No referer
        host: "localhost",
      },
    });

    const res = await middleware(req);
    expect(res.status).toBe(403);
    expect(res.statusText).toContain("Forbidden");
  });

  it("Accepts POST with matching Origin", async () => {
    // @ts-expect-error: Strict unknown type check
    process.env.NODE_ENV = "development";
    const req = new NextRequest("http://localhost/api/account/password", {
      method: "POST",
      headers: {
        origin: "http://localhost",
        host: "localhost",
      },
    });

    const res = await middleware(req);
    expect(res.status).not.toBe(403);
  });
});
