/**
 * ==========================================================================
 * API: ADMIN USER CREATION - POST /api/admin/users
 * ==========================================================================
 *
 * PURPOSE: Creates a new user account. Admin-only endpoint.
 *
 * FLOW:
 * 1. Verify the requester is an administrator (checks their profile's role)
 * 2. Look up the role ID for the requested role name
 * 3. Create the user via Supabase Admin API (createUser) - this bypasses
 *    email confirmation and creates the user immediately
 * 4. The database trigger auto-creates a profile with the role_id
 * 5. If role is "tutor", also create a tutors record
 *
 * USES ADMIN CLIENT: Supabase's admin API (auth.admin.createUser) requires
 * the SERVICE_ROLE_KEY. This is why we create a separate admin client here.
 * ==========================================================================
 */
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

async function isAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: profile } = await supabase
    .from("profiles")
    .select("roles(name)")
    .eq("id", user.id)
    .single();
  return profile?.roles?.name === "administrator";
}

export async function POST(request: Request) {
  const supabase = await createClient();

  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { email, password, full_name, role_name } = await request.json();

  if (!email || !password || !full_name) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get the role ID
  const { data: roleData } = await adminClient
    .from("roles")
    .select("id")
    .eq("name", role_name || "learner")
    .single();

  // Create the user via admin API
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name,
      role_id: roleData?.id,
    },
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  // If tutor role, also create tutor record
  if (role_name === "tutor" && authData.user) {
    await adminClient.from("tutors").insert({ user_id: authData.user.id });
  }

  return NextResponse.json({ user: authData.user }, { status: 201 });
}
