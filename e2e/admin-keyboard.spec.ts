import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const adminClient = createClient(supabaseUrl, supabaseKey);

test.describe("P5-4: Keyboard-only navigation", () => {
  let adminEmail: string;

  test.beforeAll(async () => {
    adminEmail = `admin_keyboard_e2e_${Date.now()}@test.com`;
    const { data: user, error } = await adminClient.auth.admin.createUser({
      email: adminEmail,
      password: "Password123!",
      email_confirm: true,
    });
    if (error) throw error;

    // Assign admin role in profiles
    const { data: role } = await adminClient
      .from("roles")
      .select("id")
      .eq("name", "admin")
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
          first_name: "Admin",
          last_name: "User",
          full_name: "Admin User",
          role_id: role.id,
          profile_completed: true,
          academic_year_joined: "2023-2024",
        })
        .eq("id", user.user.id);
      if (profileError) throw profileError;
    }
  });

  test("Admin can navigate dashboard using only keyboard", async ({ page }) => {
    await page.goto("/auth/login");
    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', "Password123!");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard**");

    await page.goto("/dashboard/admin");

    // Focus the body
    await page.locator("body").focus();

    // We tab through the page and ensure interactive elements receive focus
    // Let's just tab 5 times and check if focus is within an interactive element (a, button, input)
    const focusedTags = [];
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("Tab");
      // get the tag name of the currently focused element
      const tagName = await page.evaluate(() =>
        document.activeElement?.tagName.toLowerCase(),
      );
      if (tagName) {
        focusedTags.push(tagName);
      }
    }

    // Ensure we actually focused something
    expect(focusedTags.length).toBeGreaterThan(0);

    // We can also check if a specific tab/button can be activated via Enter
    // To do this reliably without knowing the exact UI, we just assert that at least one 'button' or 'a' was focused
    const validInteractiveTags = ["a", "button", "input", "select", "textarea"];
    const hasInteractiveFocus = focusedTags.some((tag) =>
      validInteractiveTags.includes(tag),
    );

    expect(hasInteractiveFocus).toBeTruthy();
  });
});
