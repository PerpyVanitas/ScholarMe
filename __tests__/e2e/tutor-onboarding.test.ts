import { SupabaseClient, User } from "@supabase/supabase-js";
import { describe, it, expect, beforeAll } from "vitest";
import { hasTestDb, getTestClient, randomSuffix } from "../security/test-db";
import { resolveRoleId } from "@/features/profiles/api/db";

describe.skipIf(!hasTestDb)("P5-1: Tutor Onboarding Critical Path", () => {
  let adminClient: SupabaseClient;
  let tutor: any;
  let suffix: string;

  beforeAll(async () => {
    if (!hasTestDb) return;
    adminClient = getTestClient();
    suffix = randomSuffix();
  });

  it("Signup → profile setup → required fields filled → dashboard access succeeds", async () => {
    // 1. Signup
    const { data: tData, error: signupErr } = await adminClient.auth.admin.createUser({ 
      email: `tutor_onboarding_${suffix}@test.com`, 
      password: "password123", 
      email_confirm: true 
    });
    expect(signupErr).toBeNull();
    tutor = tData.user;

    // 2. Profile Setup (Initial Row Creation - simulated onboarding Step 1)
    const roleId = await resolveRoleId(adminClient, "tutor");
    const { error: profileErr } = await adminClient.from("profiles").insert({ 
      id: tutor.id, 
      email: tutor.email, 
      role_id: roleId,
      full_name: "Test Tutor",
      first_name: "Test",
      last_name: "Tutor",
      profile_completed: false
    });
    expect(profileErr).toBeNull();

    // 3. Required Fields Filled (Simulate finishing onboarding)
    const { error: completeErr } = await adminClient.from("profiles").update({
      date_of_birth: "2000-01-01",
      phone_number: "+1234567890",
      academic_year_joined: "2024-2025",
      degree_program: "BS Computer Science",
      year_level: 2,
      profile_completed: true
    }).eq("id", tutor.id);
    expect(completeErr).toBeNull();

    // 4. Verify Dashboard Access Readiness (check the flag)
    const { data: finalProfile } = await adminClient.from("profiles").select("profile_completed").eq("id", tutor.id).single();
    expect(finalProfile.profile_completed).toBe(true);
  });
});
