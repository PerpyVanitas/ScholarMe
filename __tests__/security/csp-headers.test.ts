import { describe, it, expect } from "vitest";
import { middleware } from "@/middleware";
import { NextRequest } from "next/server";

describe("CSP Headers", () => {
  it("P1-22: Response includes a strict CSP header", () => {
    const req = new NextRequest("http://localhost/dashboard");
    const res = middleware(req);

    const csp = res.headers.get("Content-Security-Policy");
    expect(csp).toBeDefined();

    // Check for nonce in script-src
    expect(csp).toMatch(/script-src 'self' 'nonce-.*?' 'unsafe-eval'/);

    // Check for frame-ancestors 'none'
    expect(csp).toContain("frame-ancestors 'none'");

    // Check that style-src does not contain unsafe-eval
    expect(csp).not.toMatch(/style-src.*'unsafe-eval'/);
  });
});
