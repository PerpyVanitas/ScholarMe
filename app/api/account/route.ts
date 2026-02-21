// DELETE /api/account -- delete own account (any user)
import { createClient } from "@/lib/supabase/create-client";
import { createClient as createBareAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = createBareAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Log the deletion in analytics_logs before deleting
  await adminClient.from("analytics_logs").insert({
    user_id: user.id,
    action: "account_deleted",
    entity_type: "user",
    entity_id: user.id,
    metadata: { email: user.email, self_delete: true },
  });

  // Delete profile (cascades to tutors, sessions, etc.)
  await adminClient.from("profiles").delete().eq("id", user.id);

  // Delete the auth user
  const { error } = await adminClient.auth.admin.deleteUser(user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
