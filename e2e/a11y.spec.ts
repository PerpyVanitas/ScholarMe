import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import AxeBuilder from "@axe-core/playwright";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const adminClient = createClient(supabaseUrl, supabaseKey);

test.describe("P5-3: WCAG 2.1 AA compliance", () => {
  let testEmail: string;

  test.beforeAll(async () => {
    testEmail = `a11y_e2e_${Date.now()}@test.com`;
    const { data: user, error } = await adminClient.auth.admin.createUser({
      email: testEmail,
      password: "Password123!",
      email_confirm: true,
    });
    if (error) throw error;

    // Assign role in profiles
    const { data: role } = await adminClient
      .from("roles")
      .select("id")
      .eq("name", "learner")
      .single();
    if (role && user.user) {
      for (let i = 0; i < 10; i++) {
        const { data } = await adminClient
          .from("profiles")
          .select("id")
          .eq("id", user.user.id)
          .single();
        if (data) break;
        await new Promise((r) => setTimeout(r, 500));
      }
      const { error: profileError } = await adminClient
        .from("profiles")
        .update({
          first_name: "A11y",
          last_name: "User",
          full_name: "A11y User",
          role_id: role.id,
          profile_completed: true,
          academic_year_joined: "2023-2024",
        })
        .eq("id", user.user.id);
      if (profileError) throw profileError;
    }
  });

  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto("/auth/login");
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', "Password123!");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard**");
  });

  test("Dashboard page should not have any automatically detectable accessibility issues", async ({
    page,
  }) => {
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("Finance page should not have any automatically detectable accessibility issues", async ({
    page,
  }) => {
    await page.goto("/dashboard/finance");
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    // We expect 0 violations, or if there are minor ones we might just assert it's defined and logs them
    // For strict compliance, it should be empty.
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
