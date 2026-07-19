import { describe, it, expect } from "vitest";
import { middleware } from "@/middleware";
import { NextRequest } from "next/server";

describe("CSRF / Origin Validation", () => {
  it("P1-12: State-mutating POST without correct Origin/Referer header is rejected", () => {
    const req = new NextRequest("http://localhost/api/account/password", {
      method: "POST",
      headers: {
        // No origin
        // No referer
        host: "localhost",
      },
    });

    const res = middleware(req);
    expect(res.status).toBe(403);
    expect(res.statusText).toContain("Forbidden");
  });

  it("Accepts POST with matching Origin", () => {
    // @ts-ignore: Strict unknown type check
    process.env.NODE_ENV = "development";
    const req = new NextRequest("http://localhost/api/account/password", {
      method: "POST",
      headers: {
        origin: "http://localhost",
        host: "localhost",
      },
    });

    const res = middleware(req);
    expect(res.status).not.toBe(403);
  });
});
