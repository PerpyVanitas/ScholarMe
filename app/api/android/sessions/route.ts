import { createSupabaseForBearer } from "@/lib/supabase/bearer-client";
import { NextResponse } from "next/server";
import { z } from "zod";

const bookSessionSchema = z.object({
  tutorId: z.string().uuid("Invalid tutor ID format"),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Start time must be in HH:mm format"),
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "End time must be in HH:mm format"),
  specializationId: z.string().uuid("Invalid specialization ID format").nullable().optional(),
  notes: z.string().max(500, "Notes cannot exceed 500 characters").nullable().optional(),
});

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

    const supabase = createSupabaseForBearer(token);
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

    const supabase = createSupabaseForBearer(token);
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData.user) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_TOKEN", message: "Invalid or expired token" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = bookSessionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: result.error.errors[0].message } },
        { status: 400 }
      );
    }

    const { tutorId, scheduledDate, startTime, endTime, specializationId, notes } = result.data;

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
