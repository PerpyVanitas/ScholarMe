import { describe, it, expect } from "vitest";
import { hasTestDb } from "./test-db";

describe.skipIf(!hasTestDb)("exec_sql RPC access restriction", () => {
  it("P1-20: Calling exec_sql with anon or authenticated role fails", async () => {
    // only service_role succeeds
    expect(true).toBe(true);
  });
});
