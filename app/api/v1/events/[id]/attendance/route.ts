import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { handleApiError } from "@/lib/utils/api-error";

const attendanceActionSchema = z.object({
  action: z.enum(["check_in", "check_out"]),
  userId: z.string().uuid().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const supabase = await createClient();
    const { data: userAuth } = await supabase.auth.getUser();

    if (!userAuth.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Aggregate counts (RSVPs + Attendance) - NO individual participant names returned
    const { count: rsvpCount } = await supabase
      .from("event_rsvps")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("status", "going");

    const { count: checkedInCount } = await supabase
      .from("event_attendance")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("status", "checked_in");

    const { count: completedCount } = await supabase
      .from("event_attendance")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("status", "completed");

    // Current user attendance status
    const { data: userAttendance } = await supabase
      .from("event_attendance")
      .select("*")
      .eq("event_id", eventId)
      .eq("profile_id", userAuth.user.id)
      .maybeSingle();

    return NextResponse.json({
      eventId,
      joinedCount: (rsvpCount || 0) + (completedCount || 0),
      checkedInCount: checkedInCount || 0,
      completedCount: completedCount || 0,
      userAttendance: userAttendance || null,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const body = await request.json();
    const parseResult = attendanceActionSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { action, userId: targetUserId } = parseResult.data;
    const supabase = await createClient();
    const { data: userAuth } = await supabase.auth.getUser();

    if (!userAuth.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profileId = targetUserId || userAuth.user.id;

    // Fetch target event
    const { data: event, error: eventErr } = await supabase
      .from("facility_events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (eventErr || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const now = new Date();

    if (action === "check_in") {
      // Upsert check-in
      const { data: existing } = await supabase
        .from("event_attendance")
        .select("*")
        .eq("event_id", eventId)
        .eq("profile_id", profileId)
        .maybeSingle();

      if (existing && existing.status === "checked_in") {
        return NextResponse.json({
          message: "Already checked in",
          attendance: existing,
        });
      }

      const { data: attendance, error: insertErr } = await supabase
        .from("event_attendance")
        .upsert(
          {
            event_id: eventId,
            profile_id: profileId,
            check_in_time: now.toISOString(),
            status: "checked_in",
          },
          { onConflict: "event_id,profile_id" }
        )
        .select()
        .single();

      if (insertErr) {
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }

      return NextResponse.json({
        message: "Checked in successfully",
        attendance,
      });
    }

    // Action: check_out
    const { data: attendanceRecord } = await supabase
      .from("event_attendance")
      .select("*")
      .eq("event_id", eventId)
      .eq("profile_id", profileId)
      .maybeSingle();

    if (!attendanceRecord || attendanceRecord.status === "completed") {
      // If check-in record wasn't found, auto check-in and check-out with minimum 15m duration
      const checkInTime = attendanceRecord?.check_in_time
        ? new Date(attendanceRecord.check_in_time)
        : new Date(now.getTime() - 15 * 60000);

      const durationMinutes = Math.max(
        1,
        Math.round((now.getTime() - checkInTime.getTime()) / 60000)
      );

      // Base 50 XP + 1 XP per minute stayed (capped at 200 total)
      const xpAwarded = Math.min(200, 50 + Math.min(150, durationMinutes));

      const { data: updated, error: updateErr } = await supabase
        .from("event_attendance")
        .upsert(
          {
            event_id: eventId,
            profile_id: profileId,
            check_in_time: checkInTime.toISOString(),
            check_out_time: now.toISOString(),
            duration_minutes: durationMinutes,
            xp_awarded: xpAwarded,
            status: "completed",
          },
          { onConflict: "event_id,profile_id" }
        )
        .select()
        .single();

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      // Award XP to user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("total_xp")
        .eq("id", profileId)
        .single();

      if (profile) {
        const newXp = (profile.total_xp || 0) + xpAwarded;
        await supabase
          .from("profiles")
          .update({ total_xp: newXp })
          .eq("id", profileId);
      }

      return NextResponse.json({
        message: `Checked out successfully! You earned ${xpAwarded} XP for ${durationMinutes} mins participation.`,
        durationMinutes,
        xpAwarded,
        attendance: updated,
      });
    }

    const checkInTime = new Date(attendanceRecord.check_in_time);
    const durationMinutes = Math.max(
      1,
      Math.round((now.getTime() - checkInTime.getTime()) / 60000)
    );

    // XP calculation: Base 50 XP + 1 XP / minute (max 200 total)
    const xpAwarded = Math.min(200, 50 + Math.min(150, durationMinutes));

    const { data: updated, error: updateErr } = await supabase
      .from("event_attendance")
      .update({
        check_out_time: now.toISOString(),
        duration_minutes: durationMinutes,
        xp_awarded: xpAwarded,
        status: "completed",
      })
      .eq("id", attendanceRecord.id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Award XP to user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("total_xp")
      .eq("id", profileId)
      .single();

    if (profile) {
      const newXp = (profile.total_xp || 0) + xpAwarded;
      await supabase
        .from("profiles")
        .update({ total_xp: newXp })
        .eq("id", profileId);
    }

    return NextResponse.json({
      message: `Checked out successfully! You earned ${xpAwarded} XP for ${durationMinutes} mins participation.`,
      durationMinutes,
      xpAwarded,
      attendance: updated,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
