import { createClient } from "@/lib/supabase/create-client";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    const { data: availability, error } = await supabase
      .from("tutor_availability")
      .select("id, day_of_week, start_time, end_time, is_available")
      .eq("tutor_id", id)
      .order("day_of_week", { ascending: true });

    if (error) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Availability not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: (availability || []).map((a: any) => ({
        id: a.id,
        dayOfWeek: a.day_of_week,
        startTime: a.start_time,
        endTime: a.end_time,
        isAvailable: a.is_available,
      })),
    });
  } catch (error) {
    console.error("[Android Tutors] GET [id]/availability error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch tutor availability" } },
      { status: 500 }
    );
  }
}
