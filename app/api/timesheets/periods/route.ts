import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { isAdminRole } from "@/lib/utils/roles";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("semester_configs")
      .select("*")
      .order("start_date", { ascending: false });

    if (error) {
      // Return empty array if table doesn't exist yet
      console.warn("Could not fetch timesheet periods:", error.message);
      return NextResponse.json([]);
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error("[API Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
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
    const isAdmin = isAdminRole(roleName as string);

    if (!profile || !isAdmin) {
      return NextResponse.json(
        { error: "Access denied - admin only" },
        { status: 403 },
      );
    }

    const { name, start_date, end_date } = await req.json();
    if (!name || !start_date || !end_date) {
      return NextResponse.json(
        { error: "Name, start date, and end date are required" },
        { status: 400 },
      );
    }

    const adminClient = await createAdminClient();
    const { data, error } = await adminClient
      .from("semester_configs")
      .insert({
        name,
        start_date: new Date(start_date).toISOString(),
        end_date: new Date(end_date).toISOString(),
        is_active: false, // default to false, admin will activate it explicitly
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[API Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
