import { createSupabaseForBearer } from "@/lib/supabase/bearer-client";
import { NextResponse } from "next/server";
import { z } from "zod";

const timesheetActionSchema = z.object({
  action: z.enum(["clock_in", "clock_out"], {
    errorMap: () => ({ message: "Action must be either clock_in or clock_out" }),
  }),
});

function getBearerToken(request: Request): string | null {
  const h = request.headers.get("authorization");
  return h?.startsWith("Bearer ") ? h.substring(7) : null;
}

/** GET /api/android/timesheets - list timesheet history for authenticated user */
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

    const { data: timesheets, error } = await supabase
      .from("timesheets")
      .select("*")
      .eq("user_id", authData.user.id)
      .order("clock_in", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: timesheets ?? []
    });
  } catch (error) {
    console.error("[Android Timesheets] GET error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch timesheet history" } },
      { status: 500 }
    );
  }
}

/** POST /api/android/timesheets - clock in or clock out */
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
    const result = timesheetActionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: result.error.errors[0].message } },
        { status: 400 }
      );
    }
    const { action } = result.data;

    // Find the tutor record for this user
    const { data: tutor } = await supabase
      .from("tutors")
      .select("id")
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (!tutor) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Tutor profile not found" } },
        { status: 404 }
      );
    }

    if (action === "clock_in") {
      const { data: open } = await supabase
        .from("timesheets")
        .select("id")
        .eq("user_id", authData.user.id)
        .is("clock_out", null)
        .maybeSingle();

      if (open) {
        return NextResponse.json(
          { success: false, error: { code: "BAD_REQUEST", message: "Already clocked in" } },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from("timesheets")
        .insert({
          tutor_id: tutor.id,
          user_id: authData.user.id,
          clock_in: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({
        success: true,
        data
      });
    }

    if (action === "clock_out") {
      const { data: open } = await supabase
        .from("timesheets")
        .select("*")
        .eq("user_id", authData.user.id)
        .is("clock_out", null)
        .maybeSingle();

      if (!open) {
        return NextResponse.json(
          { success: false, error: { code: "BAD_REQUEST", message: "Not clocked in" } },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from("timesheets")
        .update({ clock_out: new Date().toISOString() })
        .eq("id", open.id)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({
        success: true,
        data
      });
    }

    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: "Invalid action" } },
      { status: 400 }
    );
  } catch (error) {
    console.error("[Android Timesheets] POST error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Operation failed" } },
      { status: 500 }
    );
  }
}
