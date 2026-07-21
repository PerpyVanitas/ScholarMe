import { SupabaseClient, User } from "@supabase/supabase-js";
import { describe, it, expect, beforeAll } from "vitest";
import { hasTestDb, getTestClient, randomSuffix } from "../security/test-db";
import { resolveRoleId } from "@/features/profiles/api/db";

describe.skipIf(!hasTestDb)("P5-2: E2E Finance Lifecycle", () => {
  let adminClient: SupabaseClient;
  let requester: User;
  let manager: User;
  let president: User;

  beforeAll(async () => {
    if (!hasTestDb) return;
    adminClient = getTestClient();
    const suffix = randomSuffix();

    // 1. Setup Users
    const { data: rData } = await adminClient.auth.admin.createUser({ email: `requester_${suffix}@test.com`, password: "password", email_confirm: true });
    requester = rData.user;
    await adminClient.from("profiles").insert({ id: requester.id, email: requester.email, role_id: await resolveRoleId(adminClient, "tutor") });

    const { data: mData } = await adminClient.auth.admin.createUser({ email: `manager_${suffix}@test.com`, password: "password", email_confirm: true });
    manager = mData.user;
    await adminClient.from("profiles").insert({ id: manager.id, email: manager.email, role_id: await resolveRoleId(adminClient, "committee_head") });

    const { data: pData } = await adminClient.auth.admin.createUser({ email: `president_${suffix}@test.com`, password: "password", email_confirm: true });
    president = pData.user;
    await adminClient.from("profiles").insert({ id: president.id, email: president.email, role_id: await resolveRoleId(adminClient, "president") });
  });

  it("Draft → Submission → Manager → President → Released", async () => {
    // 1. Draft
    const { data: draft, error: draftErr } = await adminClient.from("budgets").insert({
      title: "Event Funding",
      amount: 6000, // > 5000 requires president
      status: "pending",
      requester_id: requester.id,
      description: "Need funds for the tech summit."
    }).select().single();
    expect(draftErr).toBeNull();
    expect(draft.status).toBe("pending");

    // 2. Manager Approval (since it's > 5000, it goes to manager_approved but needs president next)
    const { data: managerApprove, error: mErr } = await adminClient.from("budgets").update({
      status: "manager_approved",
      approved_by: manager.id
    }).eq("id", draft.id).select().single();
    expect(mErr).toBeNull();
    expect(managerApprove.status).toBe("manager_approved");

    // 3. President Approval (final approval)
    const { data: presApprove, error: pErr } = await adminClient.from("budgets").update({
      status: "president_approved",
      approved_by: president.id
    }).eq("id", draft.id).select().single();
    expect(pErr).toBeNull();
    expect(presApprove.status).toBe("president_approved");

    // 4. Released (Treasury action)
    const { data: released, error: rErr } = await adminClient.from("budgets").update({
      status: "released"
    }).eq("id", draft.id).select().single();
    expect(rErr).toBeNull();
    expect(released.status).toBe("released");
  });
});
