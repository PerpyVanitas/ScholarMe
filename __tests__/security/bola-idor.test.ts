import { describe, it, expect, beforeAll } from "vitest";
import { hasTestDb, getTestClient, randomSuffix } from "./test-db";
import { createClient, SupabaseClient, User } from "@supabase/supabase-js";

describe.skipIf(!hasTestDb)("P1-3 to P1-5: BOLA / IDOR Protection", () => {
  let adminClient: SupabaseClient;
  let userA: User;
  let userB: User;
  let clientA: SupabaseClient;
  let clientB: SupabaseClient;

  beforeAll(async () => {
    if (!hasTestDb) return;
    adminClient = getTestClient();
    const suffixA = randomSuffix();
    const suffixB = randomSuffix();

    // Create User A
    const { data: dataA } = await adminClient.auth.admin.createUser({
      email: `userA_${suffixA}@test.com`,
      password: "password123",
      email_confirm: true,
    });
    userA = dataA.user!;
    await adminClient.from("profiles").insert({ id: userA.id, full_name: "User A", email: userA.email });

    // Create User B
    const { data: dataB } = await adminClient.auth.admin.createUser({
      email: `userB_${suffixB}@test.com`,
      password: "password123",
      email_confirm: true,
    });
    userB = dataB.user!;
    await adminClient.from("profiles").insert({ id: userB.id, full_name: "User B", email: userB.email });

    // Login User A
    clientA = createClient(process.env.TEST_SUPABASE_URL!, process.env.TEST_SUPABASE_ANON_KEY!);
    await clientA.auth.signInWithPassword({ email: userA.email!, password: "password123" });

    // Login User B
    clientB = createClient(process.env.TEST_SUPABASE_URL!, process.env.TEST_SUPABASE_ANON_KEY!);
    await clientB.auth.signInWithPassword({ email: userB.email!, password: "password123" });
  });

  it("P1-3: User A cannot fetch/update/delete User B's timesheet", async () => {
    // Admin creates a timesheet for User B
    const { data: timesheetB } = await adminClient.from("timesheets").insert({
      user_id: userB.id,
      clock_in: new Date().toISOString(),
    }).select().single();

    // User A tries to fetch User B's timesheet
    const { data: fetched } = await clientA.from("timesheets").select("*").eq("id", timesheetB.id);
    expect(fetched).toHaveLength(0);

    // User A tries to update User B's timesheet
    const { error: updateError } = await clientA.from("timesheets").update({ clock_out: new Date().toISOString() }).eq("id", timesheetB.id);
    expect(updateError).toBeDefined();

    // User A tries to delete User B's timesheet
    const { error: deleteError } = await clientA.from("timesheets").delete().eq("id", timesheetB.id);
    expect(deleteError).toBeDefined();
  });

  it("P1-4: User A cannot fetch User B's private conversation", async () => {
    // Admin creates a private conversation for User B and another user
    const { data: chat } = await adminClient.from("conversations").insert({ type: "direct" }).select().single();
    await adminClient.from("conversation_participants").insert([
      { conversation_id: chat.id, user_id: userB.id }
    ]);

    // User A tries to fetch User B's conversation
    const { data: fetched } = await clientA.from("conversations").select("*").eq("id", chat.id);
    expect(fetched).toHaveLength(0);
  });

  it("P1-5: User A cannot update User B's profile", async () => {
    // User A tries to update User B's profile
    const { error: updateError } = await clientA.from("profiles").update({ full_name: "Hacked" }).eq("id", userB.id);
    expect(updateError).toBeDefined();
  });
});
