import { describe, it, expect, vi } from "vitest";
import { proxy as middleware } from "@/proxy";
import { NextRequest } from "next/server";

describe("CSP Headers", () => {
  it("P1-22: Response includes a strict CSP header", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const req = new NextRequest("http://localhost/dashboard");
    const res = await middleware(req);

    const csp = res.headers.get("Content-Security-Policy");
    expect(csp).toBeDefined();

    // Check for frame-ancestors 'none'
    expect(csp).toContain("frame-ancestors 'none'");

    // Check that style-src does not contain unsafe-eval
    expect(csp).not.toMatch(/style-src.*'unsafe-eval'/);
  });
});
