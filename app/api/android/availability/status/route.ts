import { createSupabaseForBearer } from "@/lib/supabase/bearer-client";
import { NextResponse } from "next/server";

function getBearerToken(request: Request): string | null {
  const h = request.headers.get("authorization");
  return h?.startsWith("Bearer ") ? h.substring(7) : null;
}

/** PATCH /api/android/availability/status — Toggle tutor online status */
export async function PATCH(request: Request) {
  try {
    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createSupabaseForBearer(token);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
    }

    const { isAvailable } = await request.json();
    if (typeof isAvailable !== "boolean") {
      return NextResponse.json({ success: false, error: "Invalid status, expected boolean" }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("tutors")
      .update({ is_available: isAvailable })
      .eq("user_id", user.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      data: { isAvailable }
    });

  } catch (error: any) {
    console.error("[Android Availability Status] PATCH error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to update availability status" }, { status: 500 });
  }
}
