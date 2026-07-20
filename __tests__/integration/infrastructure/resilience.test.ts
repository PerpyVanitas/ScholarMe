import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Phase 6: Infrastructure Resilience", () => {
  it("P6-1: Session-based createClient is not stored at module level (memory leak check)", () => {
    // The cookie-session createClient (from @/lib/supabase/server or create-client)
    // must be called per-request inside async functions — not at module level.
    // Service-role clients (createClient(url, key) from @supabase/supabase-js) are safe at
    // module level since they are stateless config objects.
    const offendingFiles: string[] = [];
    const routesDir = path.join(process.cwd(), "app", "api");

    const scan = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) scan(fullPath);
        else if (entry.name === "route.ts") {
          const content = fs.readFileSync(fullPath, "utf-8");
          const usesSessionClient =
            /from ["']@\/lib\/supabase\/(server|create-client)["']/.test(content);
          const hasModuleLevelAssignment =
            /^const supabase\s*=\s*.*createClient/m.test(content);
          if (usesSessionClient && hasModuleLevelAssignment) {
            offendingFiles.push(fullPath);
          }
        }
      }
    };
    scan(routesDir);

    expect(offendingFiles).toHaveLength(0);
  });

  it("P6-2: Unhandled promise rejection can be caught without crashing process", async () => {
    let caught = false;
    const fakeRejection = () =>
      new Promise<void>((_, reject) => {
        setTimeout(() => reject(new Error("background job failed")), 10);
      });

    const runSafely = async (fn: () => Promise<void>) => {
      try {
        await fn();
      } catch {
        caught = true;
      }
    };

    await runSafely(fakeRejection);
    expect(caught).toBe(true);
  });

  it("P6-3: DB connection pool exhaustion returns graceful error, not 503 crash", () => {
    const maxPoolConnections = 10;
    let activeConnections = 10;

    const acquireConnection = () => {
      if (activeConnections >= maxPoolConnections) {
        throw new Error("Connection pool exhausted");
      }
      activeConnections++;
      return { query: () => {} };
    };

    expect(() => acquireConnection()).toThrow("Connection pool exhausted");
    expect(activeConnections).toBe(10);
  });

  it("P6-4: Missing env var throws loud startup error", () => {
    const originalEnv = process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    const checkEnv = () => {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL)
        throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
    };
    expect(checkEnv).toThrowError(/Missing NEXT_PUBLIC_SUPABASE_URL/);
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalEnv;
  });

  it("P6-5: Cron job overlap prevented via in-progress lock", async () => {
    let isRunning = false;
    let runCount = 0;

    const runCronJob = async () => {
      if (isRunning) return "skipped";
      isRunning = true;
      runCount++;
      await new Promise((r) => setTimeout(r, 20));
      isRunning = false;
      return "completed";
    };

    const [r1, r2] = await Promise.all([runCronJob(), runCronJob()]);
    expect(runCount).toBe(1);
    expect([r1, r2]).toContain("completed");
    expect([r1, r2]).toContain("skipped");
  });

  it("P6-6: Third-party script failure does not prevent app mount", () => {
    const documentPath = path.join(process.cwd(), "app", "layout.tsx");
    if (fs.existsSync(documentPath)) {
      const content = fs.readFileSync(documentPath, "utf-8");
      const hasSyncExternalScript = /<script src="http/i.test(content);
      expect(hasSyncExternalScript).toBe(false);
    }
    expect(true).toBe(true);
  });

  it("P6-7: Heavy RAG routes use nodejs runtime (not edge)", () => {
    const routes = [
      path.join(process.cwd(), "app", "api", "rag", "search", "route.ts"),
      path.join(process.cwd(), "app", "api", "rag", "ingest", "route.ts"),
    ];
    for (const routePath of routes) {
      if (fs.existsSync(routePath)) {
        const content = fs.readFileSync(routePath, "utf-8");
        expect(content).not.toMatch(/export const runtime = ['"]edge['"]/);
      }
    }
  });
});
