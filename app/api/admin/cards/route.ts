/** POST/PUT /api/admin/cards -- admin-only: toggle is_card_issued. */
import { createClient } from "@/lib/supabase/create-client";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("roles(name)")
    .eq("id", user.id)
    .single();

  const isAdmin = Array.isArray(profile?.roles)
    ? profile.roles.some((role: any) => role.name === "administrator")
    : (profile?.roles as any)?.name === "administrator";
  
  if (!isAdmin) return null;
  return user;
}

/** Update is_card_issued for a user */
export async function POST(request: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { user_id, is_card_issued } = await request.json();

  if (!user_id || is_card_issued === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await adminClient
    .from("profiles")
    .update({ is_card_issued })
    .eq("id", user_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
