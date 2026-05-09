/**
 * Seed script: Creates the first admin user for ScholarMe.
 * 
 * This uses the Supabase service role key to create a user
 * and assign them the administrator role.
 * 
 * Run via: node scripts/seed_admin.mjs
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
  process.exit(1);
}

// Admin credentials to create
const ADMIN_EMAIL = "admin@scholarme.org";
const ADMIN_PASSWORD = "admin123456";
const ADMIN_NAME = "System Admin";

async function supabaseRequest(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Supabase error (${res.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

async function main() {
  console.log("Creating admin user...");

  // 1. Create user via Supabase Auth Admin API
  const user = await supabaseRequest("/auth/v1/admin/users", {
    method: "POST",
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: ADMIN_NAME,
      },
    }),
  });

  console.log(`User created: ${user.id} (${user.email})`);

  // 2. Get the administrator role ID
  const roles = await supabaseRequest(
    `/rest/v1/roles?name=eq.administrator&select=id`,
    { method: "GET" }
  );

  if (!roles.length) {
    throw new Error("No administrator role found. Did migrations run?");
  }

  const adminRoleId = roles[0].id;
  console.log(`Administrator role ID: ${adminRoleId}`);

  // 3. Wait a moment for the trigger to create the profile, then update the role
  await new Promise((r) => setTimeout(r, 2000));

  // Update the profile to admin role
  const updated = await supabaseRequest(
    `/rest/v1/profiles?id=eq.${user.id}`,
    {
      method: "PATCH",
      headers: { "Prefer": "return=representation" },
      body: JSON.stringify({
        role_id: adminRoleId,
        full_name: ADMIN_NAME,
      }),
    }
  );

  console.log("Profile updated to administrator role:", updated);
  console.log("\n===================================");
  console.log("ADMIN ACCOUNT CREATED SUCCESSFULLY");
  console.log("===================================");
  console.log(`Email:    ${ADMIN_EMAIL}`);
  console.log(`Password: ${ADMIN_PASSWORD}`);
  console.log("===================================");
  console.log("\nYou can now log in at /auth/login using these credentials.");
  console.log("IMPORTANT: Change this password after first login!");
}

main().catch((err) => {
  console.error("Failed to seed admin:", err.message);
  process.exit(1);
});
