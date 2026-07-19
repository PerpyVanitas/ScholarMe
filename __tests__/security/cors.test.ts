import { describe, it, expect } from "vitest";
import { middleware } from "@/middleware";
import { NextRequest } from "next/server";

describe("CORS Enforcement", () => {
  it("P1-13: OPTIONS from evil-site.com denied on any route", () => {
    const req = new NextRequest("http://localhost/api/auth/login", {
      method: "OPTIONS",
      headers: {
        origin: "https://evil-site.com",
        host: "localhost",
      },
    });

    const res = middleware(req);
    // Our middleware blocks unapproved origins outright with 403
    expect(res.status).toBe(403);
  });

  it("Allows OPTIONS from same origin", () => {
    // @ts-ignore: Strict unknown type check
    process.env.NODE_ENV = "development";
    const req = new NextRequest("http://localhost/api/auth/login", {
      method: "OPTIONS",
      headers: {
        origin: "http://localhost",
        host: "localhost",
      },
    });

    const res = middleware(req);
    expect(res.status).toBe(204);
  });
});
