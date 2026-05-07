import { createClient } from "@/lib/supabase/create-client";
import { NextResponse } from "next/server";

function getBearerToken(request: Request): string | null {
  const h = request.headers.get("authorization");
  return h?.startsWith("Bearer ") ? h.substring(7) : null;
}

/** POST /api/android/polls/[id]/vote — cast a vote */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = getBearerToken(request);
    if (!token) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Missing token" } }, { status: 401 });

    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData.user) return NextResponse.json({ success: false, error: { code: "INVALID_TOKEN", message: "Invalid token" } }, { status: 401 });

    const { optionId } = await request.json();
    if (!optionId) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "optionId is required" } }, { status: 400 });
    }

    // Verify poll is active
    const { data: poll } = await supabase
      .from("polls")
      .select("id, status, end_date, allow_multiple_votes")
      .eq("id", params.id)
      .single();

    if (!poll || poll.status !== "active" || new Date(poll.end_date) < new Date()) {
      return NextResponse.json({ success: false, error: { code: "POLL_CLOSED", message: "This poll is no longer active" } }, { status: 409 });
    }

    // Check if already voted (unless multiple votes allowed)
    if (!poll.allow_multiple_votes) {
      const { data: existingVote } = await supabase
        .from("user_votes")
        .select("id")
        .eq("poll_id", params.id)
        .eq("user_id", authData.user.id)
        .maybeSingle();
      if (existingVote) {
        return NextResponse.json({ success: false, error: { code: "ALREADY_VOTED", message: "You have already voted on this poll" } }, { status: 409 });
      }
    }

    const { error } = await supabase.from("user_votes").insert({
      poll_id: params.id,
      option_id: optionId,
      user_id: authData.user.id,
    });

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Vote recorded successfully" });
  } catch (error) {
    console.error("[Android Polls] POST vote error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to record vote" } }, { status: 500 });
  }
}
