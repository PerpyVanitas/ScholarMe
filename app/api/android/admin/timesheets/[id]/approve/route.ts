import { createAdminClient } from "@/lib/supabase/create-client";
import { validateAdmin } from "@/lib/auth-utils";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { isAdmin } = await validateAdmin();
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { id } = await params;

    const { status } = await request.json(); // "approved" or "rejected"

    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json({ success: false, message: "Invalid status" }, { status: 400 });
    }

    const supabase = await createAdminClient();
    const { error } = await supabase
      .from("timesheets")
      .update({ status: status })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: `Timesheet ${status}` });
  } catch (error) {
    console.error("[Android Admin API] Timesheet approval error:", error);
    return NextResponse.json({ success: false, message: "Failed to update timesheet" }, { status: 500 });
  }
}
