import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const adminClient = createClient(supabaseUrl, supabaseKey);

test.describe("P5-2: Finance request lifecycle critical path", () => {
  let requesterEmail: string;
  let managerEmail: string;
  let presidentEmail: string;
  let suffix: string;

  test.beforeAll(async () => {
    suffix = `${Date.now()}`;
    requesterEmail = `requester_${suffix}@test.com`;
    managerEmail = `manager_${suffix}@test.com`;
    presidentEmail = `president_${suffix}@test.com`;

    const createProfile = async (email: string, roleName: string) => {
      const { data: user, error } = await adminClient.auth.admin.createUser({
        email,
        password: "Password123!",
        email_confirm: true,
      });
      if (error) throw error;

      const { data: role } = await adminClient
        .from("roles")
        .select("id")
        .eq("name", roleName)
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
            first_name: roleName,
            last_name: "User",
            full_name: `${roleName} User`,
            role_id: role.id,
            profile_completed: true,
            academic_year_joined: "2023-2024",
          })
          .eq("id", user.user.id);
        if (profileError) throw profileError;
      }
    };

    await createProfile(requesterEmail, "tutor");
    await createProfile(managerEmail, "committee_head");
    await createProfile(presidentEmail, "president");
  });

  test("Draft → Submission → Manager → President → Released", async ({
    page,
  }) => {
    // --- 1. Requester logs in and submits ---
    await page.goto("/auth/login");
    await page.fill('input[type="email"]', requesterEmail);
    await page.fill('input[type="password"]', "Password123!");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard**");

    await page.goto("/dashboard/finance");

    // Fill form
    await page.fill(
      'input[name="activity_title"]',
      `E2E Tech Summit ${suffix}`,
    );
    await page.fill(
      'textarea[name="objectives"]',
      "Need funds for the summit.",
    );
    await page.fill('input[name="amount"]', "6000");

    // Attach dummy file (assuming there's an input type=file)
    // We create a tiny buffer to use as file
    await page.setInputFiles('input[type="file"]', {
      name: "budget.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("dummy pdf content"),
    });

    // Click Submit
    await page.click('button:has-text("Submit Request")');

    // Verify it appears in the list as pending
    await expect(page.locator(`text=E2E Tech Summit ${suffix}`)).toBeVisible();
    await expect(page.locator("text=Status: pending").first()).toBeVisible();
    await page.click('button:has-text("Sign Out")'); // If there is a sign out button, or we can clear cookies

    // Better: clear cookies to log out
    await page.context().clearCookies();

    // --- 2. Manager logs in and starts review ---
    await page.goto("/auth/login");
    await page.fill('input[type="email"]', managerEmail);
    await page.fill('input[type="password"]', "Password123!");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard**");

    await page.goto("/dashboard/finance");
    // Find the request and click Start Review
    const requestCard = page.locator(".rounded-lg", {
      hasText: `E2E Tech Summit ${suffix}`,
    });
    await expect(requestCard).toBeVisible();
    await requestCard.locator('button:has-text("Start Review")').click();

    // Status should change to finance review
    await expect(
      requestCard.locator("text=Status: finance review"),
    ).toBeVisible();

    await page.context().clearCookies();

    // --- 3. President logs in and approves ---
    await page.goto("/auth/login");
    await page.fill('input[type="email"]', presidentEmail);
    await page.fill('input[type="password"]', "Password123!");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard**");

    await page.goto("/dashboard/finance");
    const presCard = page.locator(".rounded-lg", {
      hasText: `E2E Tech Summit ${suffix}`,
    });
    await expect(presCard).toBeVisible();
    await presCard.locator('button:has-text("President Approve")').click();

    // Status should change to president approved
    await expect(
      presCard.locator("text=Status: president approved"),
    ).toBeVisible();

    await page.context().clearCookies();

    // --- 4. Manager logs in and releases funds ---
    await page.goto("/auth/login");
    await page.fill('input[type="email"]', managerEmail);
    await page.fill('input[type="password"]', "Password123!");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard**");

    await page.goto("/dashboard/finance");
    const releaseCard = page.locator(".rounded-lg", {
      hasText: `E2E Tech Summit ${suffix}`,
    });
    await expect(releaseCard).toBeVisible();
    await releaseCard.locator('button:has-text("Release Funds")').click();

    // Status should change to released
    await expect(releaseCard.locator("text=Status: released")).toBeVisible();
  });
});
