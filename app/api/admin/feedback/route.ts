import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-errors";

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
      : (profile?.roles as { name: string } | undefined)?.name;

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

export async function PATCH(request: NextRequest) {
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
      : (profile?.roles as { name: string } | undefined)?.name;

    if (roleName !== "super_admin") {
      return NextResponse.json(
        createErrorResponse(
          "AUTH_003_ADMIN_ONLY",
          "Super Admin access required",
        ),
        { status: 403 },
      );
    }

    const body = await request.json();
    const { feedback_id, status } = body;

    if (!feedback_id || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("system_feedback")
      .update({ status })
      .eq("id", feedback_id);

    if (error) {
      console.error("Update feedback error:", error);
      return NextResponse.json(
        createErrorResponse("DB_001_NOT_FOUND", "Failed to update feedback"),
        { status: 500 },
      );
    }

    return NextResponse.json(createSuccessResponse({ success: true }), {
      status: 200,
    });
  } catch (error) {
    console.error("Feedback PATCH error:", error);
    return NextResponse.json(
      createErrorResponse(
        "SYSTEM_001_UNKNOWN_ERROR",
        "An unexpected error occurred",
      ),
      { status: 500 },
    );
  }
}
