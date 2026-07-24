import { handleApiError } from "@/lib/utils/api-error";
/** POST /api/admin/resign-role — lets an administrator voluntarily resign their admin role, reverting to tutor. */
import { createClient } from "@/lib/supabase/create-client";
import { createClient as createBareAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getAdminSupabase() {
  return createBareAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Fetch current role
    const { data: profile } = await supabase
      .from("profiles")
      .select("roles(name)")
      .eq("id", user.id)
      .single();

    const roleName = Array.isArray(profile?.roles)
      ? profile.roles[0]?.name
      : (profile?.roles as { name: string } | undefined)?.name;

    // Only administrators can resign. super_admin cannot self-resign.
    if (roleName !== "administrator") {
      return NextResponse.json(
        {
          error:
            "Only administrators can resign this role. Super Admin must transfer ownership instead.",
        },
        { status: 403 },
      );
    }

    const adminClient = getAdminSupabase();

    // Get tutor role id
    const { data: tutorRole } = await adminClient
      .from("roles")
      .select("id")
      .eq("name", "tutor")
      .single();

    if (!tutorRole) {
      return NextResponse.json(
        { error: "Could not resolve tutor role" },
        { status: 500 },
      );
    }

    // Revert role to tutor
    const { error: updateError } = await adminClient
      .from("profiles")
      .update({ role_id: tutorRole.id, role_expires_at: null })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Log the action
    await adminClient.from("analytics_logs").insert({
      user_id: user.id,
      action: "admin_role_resigned",
      entity_type: "user",
      entity_id: user.id,
      metadata: { resigned_from: "administrator", reverted_to: "tutor" },
    });

    return NextResponse.json({
      success: true,
      message: "You have successfully resigned your administrator role.",
    });
  } catch (err) {
    return handleApiError(err);
  }
}
