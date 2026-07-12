import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verify user is an admin
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("roles(name)")
      .eq("id", user.id)
      .single();
    const rawRole = profile?.roles;
    const roleName = Array.isArray(rawRole)
      ? rawRole[0]?.name
      : (rawRole as { name: string } | undefined)?.name;
    if (!["administrator", "super_admin"].includes(roleName as string)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, start_date, end_date } = body;

    if (!name || !start_date || !end_date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Deactivate current active semester
    await supabase
      .from("semester_configs")
      .update({ is_active: false })
      .eq("is_active", true);

    // Create and activate new semester
    const { data, error } = await supabase
      .from("semester_configs")
      .insert([{ name, start_date, end_date, is_active: true }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error("Semester config error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
