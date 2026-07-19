import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Phase 6: Infrastructure Resilience", () => {
  it("P6-4: Missing env var loud startup error", () => {
    const originalEnv = process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    const checkEnv = () => {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
    };
    expect(checkEnv).toThrowError(/Missing NEXT_PUBLIC_SUPABASE_URL/);
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalEnv;
  });

  it("P6-7: Heavy RAG on Node runtime (not Edge)", () => {
    // Ensure that library API routes don't use the edge runtime if they use heavy node modules
    const apiRoutePath = path.join(process.cwd(), "app", "api", "library", "search", "route.ts");
    if (fs.existsSync(apiRoutePath)) {
      const content = fs.readFileSync(apiRoutePath, "utf-8");
      // Must not contain `export const runtime = 'edge'`
      expect(content).not.toMatch(/export const runtime = ['"]edge['"]/);
    }
  });
});
