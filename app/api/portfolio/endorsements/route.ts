import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Define Zod schema for the request body
    const endorsementSchema = z.object({
      learnerId: z.string(), // learnerId is required based on original validation
      sessionId: z.string().optional(), // sessionId is optional based on original validation
      content: z.string().trim().min(1, "Content cannot be empty"), // content is required and must be a non-empty string after trimming
    });

    // Parse and validate the request body
    const body = await req.json();
    const result = endorsementSchema.safeParse(body);

    if (!result.success) {
      // Return 400 with a generic error message as per requirement
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { learnerId, sessionId, content } = result.data;

    // Original manual validation removed as it's now covered by Zod schema
    // if (!learnerId || !content || typeof content !== "string" || content.trim().length === 0) {
    //   return NextResponse.json({ error: "Invalid request parameters" }, { status: 400 });
    // }

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
        content: content, // content is already trimmed and validated by Zod
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
