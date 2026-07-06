import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-errors";
import { isAdminRole } from "@/lib/utils/roles";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        createErrorResponse("AUTH_002_SESSION_EXPIRED", "Session expired"),
        { status: 401 },
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("roles(name)")
      .eq("id", user.id)
      .single();

    const roleName = Array.isArray(profile?.roles)
      ? profile.roles[0]?.name
      : (profile?.roles as any)?.name;

    if (!isAdminRole(roleName)) {
      return NextResponse.json(
        createErrorResponse("AUTH_003_ADMIN_ONLY", "Admin access required"),
        { status: 403 },
      );
    }

    // Since only Super Admin should view feedback based on user request, let's enforce super_admin
    if (roleName !== "super_admin") {
      return NextResponse.json(
        createErrorResponse(
          "AUTH_003_ADMIN_ONLY",
          "Super Admin access required",
        ),
        { status: 403 },
      );
    }

    const { data: feedback, error } = await supabase
      .from("system_feedback")
      .select("*, profiles(id, full_name, email, avatar_url)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch feedback error:", error);
      return NextResponse.json(
        createErrorResponse("DB_001_NOT_FOUND", "Failed to fetch feedback"),
        { status: 500 },
      );
    }

    return NextResponse.json(createSuccessResponse(feedback), { status: 200 });
  } catch (error) {
    console.error("Feedback API error:", error);
    return NextResponse.json(
      createErrorResponse(
        "SYSTEM_001_UNKNOWN_ERROR",
        "An unexpected error occurred",
      ),
      { status: 500 },
    );
  }
}
