import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("roles(name)")
      .eq("id", user.id)
      .single();

    const roleName = Array.isArray(profile?.roles)
      ? profile.roles[0]?.name
      : (profile?.roles as any)?.name;
    const isAdmin = roleName === "admin" || roleName === "administrator";

    if (!profile || !isAdmin) {
      return NextResponse.json({ error: "Access denied - admin only" }, { status: 403 });
    }

    const { is_active } = await req.json();

    const adminClient = await createAdminClient();

    if (is_active) {
      // First, deactivate all other periods
      const { error: deactivateError } = await adminClient
        .from("timesheet_periods")
        .update({ is_active: false })
        .neq("id", id);

      if (deactivateError) {
        return NextResponse.json({ error: deactivateError.message }, { status: 500 });
      }

      // Then, activate the target period
      const { data, error } = await adminClient
        .from("timesheet_periods")
        .update({ is_active: true })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data);
    } else {
      // Deactivate the target period
      const { data, error } = await adminClient
        .from("timesheet_periods")
        .update({ is_active: false })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data);
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
