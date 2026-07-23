import { describe, it, expect } from "vitest";
import { proxy as middleware } from "@/proxy";
import { NextRequest } from "next/server";

describe("CORS Enforcement", () => {
  it("P1-13: OPTIONS from evil-site.com denied on any route", async () => {
    const req = new NextRequest("http://localhost/api/auth/login", {
      method: "OPTIONS",
      headers: {
        origin: "https://evil-site.com",
        host: "localhost",
      },
    });

    const res = await middleware(req);
    // Our middleware blocks unapproved origins outright with 403
    expect(res.status).toBe(403);
  });

  it("Allows OPTIONS from same origin", async () => {
    // @ts-expect-error: Strict unknown type check
    process.env.NODE_ENV = "development";
    const req = new NextRequest("http://localhost/api/auth/login", {
      method: "OPTIONS",
      headers: {
        origin: "http://localhost",
        host: "localhost",
      },
    });

    const res = await middleware(req);
    expect(res.status).toBe(204);
  });
});
