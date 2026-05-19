import { createSupabaseForBearer } from "@/lib/supabase/bearer-client";
import { NextResponse } from "next/server";

function getBearerToken(request: Request): string | null {
  const h = request.headers.get("authorization");
  return h?.startsWith("Bearer ") ? h.substring(7) : null;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** GET /api/android/availability — Fetch availability slots for logged-in tutor */
export async function GET(request: Request) {
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

    // Fetch the tutor row first
    const { data: tutor, error: tutorError } = await supabase
      .from("tutors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (tutorError || !tutor) {
      return NextResponse.json({ success: false, error: "Tutor profile not found" }, { status: 404 });
    }

    // Fetch availability
    const { data: slots, error: slotsError } = await supabase
      .from("tutor_availability")
      .select("id, day_of_week, start_time, end_time, is_available")
      .eq("tutor_id", tutor.id);

    if (slotsError) {
      throw slotsError;
    }

    // Map to TimeSlotDto format expected by Android client
    const mappedSlots = (slots ?? []).map(s => {
      const startTime = s.start_time ? s.start_time.substring(0, 5) : "09:00";
      const endTime = s.end_time ? s.end_time.substring(0, 5) : "17:00";
      return {
        id: s.id,
        day: DAYS[s.day_of_week] || "Monday",
        startTime,
        endTime,
        isActive: s.is_available ?? true
      };
    });

    return NextResponse.json({
      success: true,
      data: mappedSlots
    });

  } catch (error: any) {
    console.error("[Android Availability] GET error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch availability" }, { status: 500 });
  }
}

/** POST /api/android/availability — Update/replace availability slots */
export async function POST(request: Request) {
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

    // Fetch the tutor row first
    const { data: tutor, error: tutorError } = await supabase
      .from("tutors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (tutorError || !tutor) {
      return NextResponse.json({ success: false, error: "Tutor profile not found" }, { status: 404 });
    }

    const slotsInput = await request.json();
    if (!Array.isArray(slotsInput)) {
      return NextResponse.json({ success: false, error: "Invalid payload, expected array" }, { status: 400 });
    }

    // Delete all existing slots for this tutor
    const { error: deleteError } = await supabase
      .from("tutor_availability")
      .delete()
      .eq("tutor_id", tutor.id);

    if (deleteError) {
      throw deleteError;
    }

    // Filter and map active slots to database format
    const rowsToInsert = slotsInput
      .filter((s: any) => s.isActive)
      .map((s: any) => {
        let dayOfWeek = DAYS.indexOf(s.day);
        if (dayOfWeek === -1) {
          dayOfWeek = DAYS.findIndex(d => d.toLowerCase() === s.day.toLowerCase());
          if (dayOfWeek === -1) dayOfWeek = 1; // Default to Monday
        }
        return {
          tutor_id: tutor.id,
          day_of_week: dayOfWeek,
          start_time: s.startTime ? (s.startTime.length === 5 ? `${s.startTime}:00` : s.startTime) : "09:00:00",
          end_time: s.endTime ? (s.endTime.length === 5 ? `${s.endTime}:00` : s.endTime) : "17:00:00",
          is_available: true
        };
      });

    if (rowsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("tutor_availability")
        .insert(rowsToInsert);

      if (insertError) {
        throw insertError;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Availability saved successfully"
    });

  } catch (error: any) {
    console.error("[Android Availability] POST error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to save availability" }, { status: 500 });
  }
}
