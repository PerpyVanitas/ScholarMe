/**
 * ==========================================================================
 * API: UPDATE SESSION STATUS - PUT /api/sessions/[id]/status
 * ==========================================================================
 *
 * PURPOSE: Changes a session's status. Used by:
 * - Tutors: "confirmed" (accept booking), "completed" (mark done), "cancelled" (decline)
 * - Learners: "cancelled" (cancel their booking)
 *
 * Body: { status: "confirmed" | "completed" | "cancelled" }
 * Returns: The updated session record
 *
 * IMPORTANT: The `params` object is a Promise in Next.js 16 and must be awaited.
 * ==========================================================================
 */
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { status } = await request.json();

  if (!["confirmed", "completed", "cancelled"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("sessions")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
