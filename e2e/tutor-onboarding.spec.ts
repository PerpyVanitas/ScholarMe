import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const adminClient = createClient(supabaseUrl, supabaseKey);

test.describe("P5-1: Tutor Onboarding Critical Path", () => {
  let testEmail: string;

  test.beforeAll(async () => {
    testEmail = `tutor_onboarding_e2e_${Date.now()}@test.com`;
    // We create the user via admin API to ensure they are confirmed
    // The test will log them in to test the profile setup and dashboard access
    const { data: user, error } = await adminClient.auth.admin.createUser({
      email: testEmail,
      password: "Password123!",
      email_confirm: true,
      user_metadata: {
        first_name: "E2E",
        last_name: "Tutor",
        role_name: "tutor",
      },
    });
    if (error) throw error;

    // Wait for trigger to create profile, then update
    const { data: role } = await adminClient
      .from("roles")
      .select("id")
      .eq("name", "tutor")
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
      await adminClient
        .from("profiles")
        .update({
          first_name: "E2E",
          last_name: "Tutor",
          full_name: "E2E Tutor",
          role_id: role.id,
          profile_completed: false,
        })
        .eq("id", user.user.id);
    }

    // Ensure at least one specialization exists
    const { count } = await adminClient
      .from("specializations")
      .select("*", { count: "exact", head: true });
    if (count === 0) {
      await adminClient
        .from("specializations")
        .insert([{ name: "Mathematics" }]);
    }
  });

  test("Tutor logs in, completes profile setup, and accesses dashboard", async ({
    page,
  }) => {
    test.setTimeout(120000); // Increase timeout for Next.js compilation
    page.on("console", (msg) => console.log("BROWSER CONSOLE:", msg.text()));

    // 1. Login
    await page.goto("/auth/login");
    await page.waitForTimeout(2000); // Wait for React hydration
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', "Password123!");
    await page.click('button[type="submit"]');

    // 2. Profile Setup
    await page.waitForURL("**/auth/setup-profile**");

    // Debug: Print page content if it's stuck loading
    try {
      await page.waitForSelector("input#firstName", { timeout: 10000 });
    } catch (e) {
      console.log("HTML Dump:", await page.content());
    }

    // Fill tutor specific fields (use force in case of Next.js dev overlay)
    await page.locator("input#firstName").fill("E2E", { force: true });
    await page.locator("input#lastName").fill("Tutor", { force: true });

    // Academic Year (it's a select now)
    await page.selectOption("select#academicYearJoined", "2024-2025", {
      force: true,
    });

    // Membership Number
    await page
      .locator("input#membershipNumber")
      .fill("TM-2025-E2E", { force: true });

    // Bio
    await page
      .locator("textarea#bio")
      .fill("I am an E2E testing tutor with extensive automated experience.", {
        force: true,
      });

    // Specialization - we need to wait for specializations to load and click one
    // They are rendered as buttons with role="button" (default button tag)
    await page.waitForSelector("text=Select at least one subject");
    // Click the first specialization button that appears inside the spec container
    // Let's just click the first button after "Specializations *"
    await page.click('button:has-text("Mathematics")'); // Assuming Mathematics exists, or we can just click the first available

    // Actually, to be safe, let's select by class or first button in that area
    // The spec buttons have border-border class
    const specButtons = page.locator("button.rounded-full.border");
    await specButtons.first().click({ force: true });

    // Click "Complete Setup"
    await page
      .locator('button:has-text("Complete Setup")')
      .click({ force: true });

    // 3. Verify Dashboard Access
    await page.waitForURL("**/dashboard**");
    await expect(page.locator("text=E2E Tutor").first()).toBeVisible({
      timeout: 10000,
    });
  });
});
