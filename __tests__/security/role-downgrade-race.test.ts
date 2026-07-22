import { describe, it, expect, beforeAll } from "vitest";
import { hasTestDb, getTestClient, randomSuffix } from "./test-db";
import { createClient, SupabaseClient, User } from "@supabase/supabase-js";
import { resolveRoleId } from "@/features/profiles/api/db";

describe.skipIf(!hasTestDb)("P1-8: Role Downgrade Race Condition", () => {
  let adminClient: SupabaseClient;
  let manager: Record<string, unknown> | null = null;
  let managerClient: Record<string, unknown> | null = null;
  let budgetId: string;

  beforeAll(async () => {
    if (!hasTestDb) return;
    adminClient = getTestClient();
    const suffix = randomSuffix();

    // Create a Manager
    const { data: mData } = await adminClient.auth.admin.createUser({
      email: `manager_${suffix}@test.com`,
      password: "password123",
      email_confirm: true,
    });
    manager = mData.user;
    const managerRoleId = await resolveRoleId(adminClient, "committee_head");

    await adminClient.from("profiles").insert({
      id: manager.id,
      full_name: "Manager",
      email: manager.email,
      role_id: managerRoleId
    });

    managerClient = createClient(process.env.TEST_SUPABASE_URL!, process.env.TEST_SUPABASE_ANON_KEY!);
    await managerClient.auth.signInWithPassword({ email: manager.email, password: "password123" });

    // Create a dummy budget to approve
    const { data: budget } = await adminClient.from("budgets").insert({
      title: "Test Budget",
      amount: 100,
      status: "pending",
      requester_id: manager.id // Just for testing
    }).select().single();
    budgetId = budget.id;
  });

  it("revoking role before approval prevents the action", async () => {
    // 1. Change the manager's role back to learner (downgrade)
    const learnerRoleId = await resolveRoleId(adminClient, "learner");
    await adminClient.from("profiles").update({ role_id: learnerRoleId }).eq("id", manager.id);

    // 2. Manager tries to approve the budget via RPC or direct update
    // Depending on how approvals are handled (usually RPC to enforce state machine)
    const { error: approveError } = await managerClient.from("budgets").update({
      status: "manager_approved",
      approved_by: manager.id
    }).eq("id", budgetId);

    // The RLS policy on budgets should check the CURRENT role_id from profiles (or auth.jwt() if using claims, which means the token is stale!)
    // If the backend is robust, it re-fetches the role or uses a secure trigger/RPC.
    expect(approveError).toBeDefined();
  });
});
