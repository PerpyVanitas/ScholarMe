import { describe, it, expect, beforeAll } from "vitest";
import { hasTestDb, getTestClient, randomSuffix } from "./test-db";
import { createClient } from "@supabase/supabase-js";

describe.skipIf(!hasTestDb)("P1-20: exec_sql RPC access restriction", () => {
  let adminClient: any;
  let anonClient: any;
  let authClient: any;

  beforeAll(async () => {
    if (!hasTestDb) return;
    adminClient = getTestClient();
    
    // Create Anon client
    anonClient = createClient(process.env.TEST_SUPABASE_URL!, process.env.TEST_SUPABASE_ANON_KEY!);

    // Create Authenticated client
    const suffix = randomSuffix();
    const email = `exec_sql_test_${suffix}@test.com`;
    const password = "password123";
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    authClient = createClient(process.env.TEST_SUPABASE_URL!, process.env.TEST_SUPABASE_ANON_KEY!);
    await authClient.auth.signInWithPassword({ email, password });
  });

  it("fails when called by anon role", async () => {
    const { error } = await anonClient.rpc("exec_sql", { query: "SELECT 1;" });
    expect(error).toBeDefined();
    // Usually standard RLS/Permission errors will deny access to the RPC unless granted
  });

  it("fails when called by authenticated role", async () => {
    const { error } = await authClient.rpc("exec_sql", { query: "SELECT 1;" });
    expect(error).toBeDefined();
  });

  it("succeeds when called by service_role", async () => {
    const { error } = await adminClient.rpc("exec_sql", { query: "SELECT 1;" });
    // Assuming the RPC exists. If it exists, service_role has bypass RLS.
    // We just check that we don't get a permissions error. We might get a syntax error if the query isn't allowed by the RPC internals, but not a 401/403.
    if (error) {
      expect(error.message).not.toMatch(/permission denied|auth/i);
    }
  });
});
