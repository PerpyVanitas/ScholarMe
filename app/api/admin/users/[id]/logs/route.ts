// GET /api/admin/users/[id]/logs -- fetch action history for a user
import { createClient } from "@/lib/supabase/create-client";
import { createClient as createBareAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("roles(name)")
    .eq("id", user.id)
    .single();

  const roles = profile?.roles as any;
  const isAdmin = Array.isArray(roles)
    ? roles.some((r) => r.name === "administrator")
    : roles?.name === "administrator";

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const adminClient = createBareAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch logs where user_id matches OR entity_id matches (actions BY or ON this user)
  const { data: logs, error } = await adminClient
    .from("analytics_logs")
    .select("*")
    .or(`user_id.eq.${id},entity_id.eq.${id}`)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ logs: logs || [] });
}
