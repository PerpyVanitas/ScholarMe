import { handleApiError } from "@/lib/utils/api-error";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const start_date = searchParams.get("start_date");
    const end_date = searchParams.get("end_date");

    if (!start_date || !end_date) {
      return NextResponse.json(
        { error: "Missing date range" },
        { status: 400 },
      );
    }

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

    // Call the new RPC
    const { data, error } = await supabase.rpc("get_hall_of_fame", {
      timeframe_start: start_date,
      timeframe_end: end_date,
    });

    if (error) {
      return handleApiError(error);
    }

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
