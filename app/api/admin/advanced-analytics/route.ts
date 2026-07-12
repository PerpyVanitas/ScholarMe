import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
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
    type RoleEntry = { name: string };
    const roleName = Array.isArray(rawRole)
      ? (rawRole as RoleEntry[])[0]?.name
      : (rawRole as RoleEntry | null)?.name;
    if (!["administrator", "super_admin"].includes(roleName ?? "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // --- Check if the semester_configs table exists (i.e. migration has been applied) ---
    const { error: tableCheckError } = await supabase
      .from("semester_configs")
      .select("id", { count: "exact", head: true });

    // If the table doesn't exist, the migration hasn't been run yet.
    if (tableCheckError) {
      return NextResponse.json(
        {
          success: false,
          migrationRequired: true,
          error:
            "The advanced analytics migration has not been applied yet. Please run 20260522_advanced_analytics_rpc.sql in your Supabase SQL Editor.",
        },
        { status: 503 },
      );
    }

    // --- Check if there is an active semester ---
    const { data: activeSemester } = await supabase
      .from("semester_configs")
      .select("id, name, start_date, end_date")
      .eq("is_active", true)
      .maybeSingle();

    if (!activeSemester) {
      // Return empty-but-valid shape so the UI can show the "configure semester" prompt
      return NextResponse.json({
        success: true,
        noSemester: true,
        data: {
          semester: null,
          compliance: [],
          hall_of_fame: {
            most_hours: null,
            best_rating: null,
            most_students: null,
            most_xp: null,
          },
          supply_demand: [],
        },
      });
    }

    // --- Call the RPC ---
    const { data, error } = await supabase.rpc("get_advanced_analytics");

    if (error) {
      console.error("RPC get_advanced_analytics failed:", error);
      // Return a structured error with the Postgres message for debugging
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          hint: error.hint ?? null,
          details: error.details ?? null,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Advanced analytics unexpected error:", error);
    return NextResponse.json(
      { error: error.message ?? "Unknown server error" },
      { status: 500 },
    );
  }
}
