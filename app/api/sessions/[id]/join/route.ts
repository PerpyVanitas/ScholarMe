import { createClient } from "@/lib/supabase/create-client";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("id, learner_id, max_participants, status, scheduled_date")
    .eq("id", id)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.max_participants <= 1) {
    return NextResponse.json(
      { error: "This is not a group session" },
      { status: 400 },
    );
  }

  if (!["pending", "confirmed"].includes(session.status)) {
    return NextResponse.json(
      { error: "Session is not open for joining" },
      { status: 400 },
    );
  }

  if (session.learner_id === user.id) {
    return NextResponse.json(
      { error: "You are already the host of this session" },
      { status: 400 },
    );
  }

  const { count: participantCount } = await supabase
    .from("session_participants")
    .select("*", { count: "exact", head: true })
    .eq("session_id", id)
    .neq("status", "cancelled");

  if ((participantCount ?? 0) >= session.max_participants) {
    return NextResponse.json({ error: "Session is full" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("session_participants")
    .select("learner_id")
    .eq("session_id", id)
    .eq("learner_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "You are already registered for this session" },
      { status: 400 },
    );
  }

  const { error: insertError } = await supabase
    .from("session_participants")
    .insert({
      session_id: id,
      learner_id: user.id,
      status: "registered",
    });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
