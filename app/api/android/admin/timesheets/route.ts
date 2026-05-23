import { createAdminClient } from "@/lib/supabase/create-client";
import { validateAndroidAdmin } from "@/lib/auth-utils";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { isAdmin } = await validateAndroidAdmin(request);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const supabase = await createAdminClient();

    
    const { data: timesheets, error } = await supabase
      .from("timesheets")
      .select("id, tutor_id, total_hours, amount, status, period_start, period_end, tutors(profiles(full_name))")
      .order("period_start", { ascending: false });

    if (error) throw error;

    const formatted = (timesheets ?? []).map((t: any) => ({
      id: t.id,
      tutorId: t.tutor_id,
      tutorName: t.tutors?.profiles?.full_name ?? "Unknown Tutor",
      totalHours: t.total_hours,
      amount: t.amount,
      status: t.status,
      periodStart: t.period_start,
      periodEnd: t.period_end
    }));

    return NextResponse.json({
      success: true,
      data: formatted
    });
  } catch (error) {
    console.error("[Android Admin API] Timesheets error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch timesheets" }, { status: 500 });
  }
}
