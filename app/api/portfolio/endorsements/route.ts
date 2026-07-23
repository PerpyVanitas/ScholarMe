import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { learnerId, sessionId, content } = await req.json();

    if (!learnerId || !content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: "Invalid request parameters" }, { status: 400 });
    }

    // Security Check: Verify that the tutor has at least one completed session with this learner
    const { data: verifiedSessions } = await supabase
      .from("sessions")
      .select("id")
      .eq("tutor_id", user.id)
      .eq("learner_id", learnerId)
      .eq("status", "completed");

    if (!verifiedSessions || verifiedSessions.length === 0) {
      return NextResponse.json(
        { error: "Forbidden: You can only endorse learners with whom you have a completed tutoring session." },
        { status: 403 }
      );
    }

    // Insert endorsement
    const { data: endorsement, error: insertErr } = await supabase
      .from("tutor_endorsements")
      .insert({
        tutor_id: user.id,
        learner_id: learnerId,
        session_id: sessionId || verifiedSessions[0].id,
        content: content.trim(),
        is_public: true,
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Endorsement insert error:", insertErr);
      return NextResponse.json({ error: "Failed to save endorsement" }, { status: 500 });
    }

    return NextResponse.json({ endorsement });
  } catch (err: unknown) {
    console.error("Endorsement API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
