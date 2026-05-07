import { createClient } from "@/lib/supabase/create-client";
import { NextResponse } from "next/server";

function getBearerToken(request: Request): string | null {
  const h = request.headers.get("authorization");
  return h?.startsWith("Bearer ") ? h.substring(7) : null;
}

/** GET /api/android/sessions — list sessions for the authenticated user (role-aware) */
export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20", 10));
    const statusFilter = searchParams.get("status");
    const offset = (page - 1) * limit;

    // Get user role
    const { data: profile } = await supabase
      .from("profiles")
      .select("roles:roles!role_id(name)")
      .eq("id", authData.user.id)
      .single();
    const roleName: string = Array.isArray(profile?.roles)
      ? (profile.roles[0]?.name ?? "learner")
      : ((profile?.roles as any)?.name ?? "learner");

    let query = supabase
      .from("sessions")
      .select(
        `id, tutor_id, learner_id, scheduled_date, start_time, end_time, status, notes, created_at,
         tutors(id, user_id, profiles!user_id(full_name, avatar_url)),
         specializations(id, name)`,
        { count: "exact" }
      )
      .range(offset, offset + limit - 1)
      .order("scheduled_date", { ascending: false });

    if (roleName === "tutor") {
      const { data: tutorRow } = await supabase.from("tutors").select("id").eq("user_id", authData.user.id).single();
      if (!tutorRow) {
        return NextResponse.json({ success: true, data: { sessions: [], pagination: { page, limit, total: 0, pages: 0 } } });
      }
      query = query.eq("tutor_id", tutorRow.id);
    } else {
      query = query.eq("learner_id", authData.user.id);
    }

    if (statusFilter) query = query.eq("status", statusFilter);

    const { data: sessions, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: {
        sessions: (sessions ?? []).map((s: any) => ({
          id: s.id,
          tutorId: s.tutor_id,
          tutorName: s.tutors?.profiles?.full_name ?? null,
          tutorAvatarUrl: s.tutors?.profiles?.avatar_url ?? null,
          learnerId: s.learner_id,
          scheduledDate: s.scheduled_date,
          startTime: s.start_time,
          endTime: s.end_time,
          status: s.status,
          notes: s.notes ?? null,
          specializationName: s.specializations?.name ?? null,
          createdAt: s.created_at,
        })),
        pagination: { page, limit, total: count ?? 0, pages: Math.ceil((count ?? 0) / limit) },
      },
    });
  } catch (error) {
    console.error("[Android Sessions] GET error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch sessions" } },
      { status: 500 }
    );
  }
}

/** POST /api/android/sessions — book a session (learner only) */
export async function POST(request: Request) {
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

    const body = await request.json();
    const { tutorId, scheduledDate, startTime, endTime, specializationId, notes } = body;

    if (!tutorId || !scheduledDate || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "tutorId, scheduledDate, startTime, endTime are required" } },
        { status: 400 }
      );
    }

    const { data: session, error } = await supabase
      .from("sessions")
      .insert({
        tutor_id: tutorId,
        learner_id: authData.user.id,
        scheduled_date: scheduledDate,
        start_time: startTime,
        end_time: endTime,
        specialization_id: specializationId ?? null,
        notes: notes ?? null,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: session }, { status: 201 });
  } catch (error) {
    console.error("[Android Sessions] POST error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to create session" } },
      { status: 500 }
    );
  }
}
