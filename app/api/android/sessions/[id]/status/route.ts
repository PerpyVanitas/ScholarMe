import { createClient } from "@/lib/supabase/create-client";
import { NextResponse } from "next/server";

function getBearerToken(request: Request): string | null {
  const h = request.headers.get("authorization");
  return h?.startsWith("Bearer ") ? h.substring(7) : null;
}

/** PUT /api/android/sessions/[id]/status — update session status */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Missing authorization token" } },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData.user) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_TOKEN", message: "Invalid or expired token" } },
        { status: 401 }
      );
    }

    const { status, cancellationReason } = await request.json();
    const VALID_STATUSES = ["pending", "confirmed", "completed", "cancelled"];
    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: `Status must be one of: ${VALID_STATUSES.join(", ")}` } },
        { status: 400 }
      );
    }

    const updateData: Record<string, string> = { status };
    if (cancellationReason) updateData.cancellation_reason = cancellationReason;

    const { data: session, error } = await supabase
      .from("sessions")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: session });
  } catch (error) {
    console.error("[Android Sessions] PUT status error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to update session status" } },
      { status: 500 }
    );
  }
}
