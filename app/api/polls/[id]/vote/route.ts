/** POST /api/polls/[id]/vote - Cast a vote on a poll */
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-errors";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: pollId } = await params;
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      createErrorResponse("AUTH_003_FORBIDDEN", "Authentication required to vote"),
      { status: 401 }
    );
  }

  const body = await request.json();
  const { option_id } = body;

  if (!option_id) {
    return NextResponse.json(
      createErrorResponse("VALID_001_GENERAL", { option_id: "Option selection is required" }),
      { status: 400 }
    );
  }

  // Check if poll exists and is active
  const { data: poll } = await supabase
    .from("polls")
    .select("*, poll_options(*)")
    .eq("id", pollId)
    .single();

  if (!poll) {
    return NextResponse.json(
      createErrorResponse("DB_001_NOT_FOUND", "Poll not found"),
      { status: 404 }
    );
  }

  if (poll.status !== "active") {
    return NextResponse.json(
      createErrorResponse("BUS_001_SCHEDULING_CONFLICT", "This poll is no longer accepting votes"),
      { status: 400 }
    );
  }

  // Check if poll has ended
  if (new Date(poll.end_date) < new Date()) {
    return NextResponse.json(
      createErrorResponse("BUS_001_SCHEDULING_CONFLICT", "This poll has ended"),
      { status: 400 }
    );
  }

  // Check if option belongs to poll
  const validOption = poll.poll_options?.some((opt: { id: string }) => opt.id === option_id);
  if (!validOption) {
    return NextResponse.json(
      createErrorResponse("VALID_001_GENERAL", { option_id: "Invalid option for this poll" }),
      { status: 400 }
    );
  }

  // Check if user already voted (if multiple votes not allowed)
  if (!poll.allow_multiple_votes) {
    const { data: existingVote } = await supabase
      .from("user_votes")
      .select("id")
      .eq("poll_id", pollId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingVote) {
      return NextResponse.json(
        createErrorResponse("BUS_001_SCHEDULING_CONFLICT", "You have already voted on this poll"),
        { status: 400 }
      );
    }
  }

  // Cast vote
  const { data: vote, error } = await supabase
    .from("user_votes")
    .insert({
      poll_id: pollId,
      option_id,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") { // Unique violation
      return NextResponse.json(
        createErrorResponse("BUS_001_SCHEDULING_CONFLICT", "You have already voted for this option"),
        { status: 400 }
      );
    }
    return NextResponse.json(
      createErrorResponse("SYSTEM_001_DATABASE_ERROR", error.message),
      { status: 500 }
    );
  }

  return NextResponse.json(createSuccessResponse({ vote, message: "Vote recorded successfully" }));
}
