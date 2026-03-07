/** GET /api/polls/[id]/results - Get poll results with vote counts */
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { createSuccessResponse, createErrorResponse } from "@/lib/error-codes";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: pollId } = await params;
  const supabase = await createClient();

  // Get poll with options
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select(`
      *,
      profiles:created_by(id, full_name, avatar_url),
      poll_options(id, option_text, display_order)
    `)
    .eq("id", pollId)
    .single();

  if (pollError || !poll) {
    return NextResponse.json(
      createErrorResponse("DB_001_NOT_FOUND", "Poll not found"),
      { status: 404 }
    );
  }

  // Get vote counts per option
  const { data: voteCounts } = await supabase
    .from("user_votes")
    .select("option_id")
    .eq("poll_id", pollId);

  const countMap: Record<string, number> = {};
  voteCounts?.forEach((v) => {
    countMap[v.option_id] = (countMap[v.option_id] || 0) + 1;
  });

  // Get total votes
  const totalVotes = voteCounts?.length || 0;

  // Get current user's vote(s)
  const { data: { user } } = await supabase.auth.getUser();
  let userVotes: string[] = [];
  
  if (user) {
    const { data: votes } = await supabase
      .from("user_votes")
      .select("option_id")
      .eq("poll_id", pollId)
      .eq("user_id", user.id);
    userVotes = votes?.map((v) => v.option_id) || [];
  }

  // Attach vote counts to options
  const optionsWithCounts = poll.poll_options?.map((opt: { id: string; option_text: string; display_order: number }) => ({
    ...opt,
    vote_count: countMap[opt.id] || 0,
    percentage: totalVotes > 0 ? Math.round((countMap[opt.id] || 0) / totalVotes * 100) : 0,
  })) || [];

  return NextResponse.json(
    createSuccessResponse({
      poll: {
        ...poll,
        poll_options: optionsWithCounts,
      },
      totalVotes,
      userVotes,
      hasVoted: userVotes.length > 0,
    })
  );
}
