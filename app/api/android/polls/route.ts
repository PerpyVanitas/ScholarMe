import { createSupabaseForBearer } from "@/lib/supabase/bearer-client";
import { NextResponse } from "next/server";

function getBearerToken(request: Request): string | null {
  const h = request.headers.get("authorization");
  return h?.startsWith("Bearer ") ? h.substring(7) : null;
}

/** GET /api/android/polls — list active polls with user's vote status */
export async function GET(request: Request) {
  try {
    const token = getBearerToken(request);
    if (!token) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Missing token" } }, { status: 401 });

    const supabase = createSupabaseForBearer(token);
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData.user) return NextResponse.json({ success: false, error: { code: "INVALID_TOKEN", message: "Invalid token" } }, { status: 401 });

    const { data: polls, error } = await supabase
      .from("polls")
      .select("id, title, description, status, start_date, end_date, allow_multiple_votes, is_anonymous, created_at, poll_options(id, option_text, display_order)")
      .eq("status", "active")
      .gt("end_date", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Get user's votes
    const pollIds = (polls ?? []).map((p: any) => p.id);
    const { data: userVotes } = pollIds.length
      ? await supabase.from("user_votes").select("poll_id, option_id").eq("user_id", authData.user.id).in("poll_id", pollIds)
      : { data: [] };

    const voteMap: Record<string, string[]> = {};
    (userVotes ?? []).forEach((v: any) => {
      if (!voteMap[v.poll_id]) voteMap[v.poll_id] = [];
      voteMap[v.poll_id].push(v.option_id);
    });

    // Get vote counts per option
    const { data: voteCounts } = pollIds.length
      ? await supabase.from("user_votes").select("option_id").in("poll_id", pollIds)
      : { data: [] };

    const countMap: Record<string, number> = {};
    (voteCounts ?? []).forEach((v: any) => {
      countMap[v.option_id] = (countMap[v.option_id] ?? 0) + 1;
    });

    return NextResponse.json({
      success: true,
      data: {
        polls: (polls ?? []).map((p: any) => ({
          id: p.id,
          title: p.title,
          description: p.description ?? null,
          status: p.status,
          endDate: p.end_date,
          allowMultipleVotes: p.allow_multiple_votes,
          isAnonymous: p.is_anonymous,
          userVotedOptionIds: voteMap[p.id] ?? [],
          hasVoted: (voteMap[p.id]?.length ?? 0) > 0,
          options: (p.poll_options ?? [])
            .sort((a: any, b: any) => a.display_order - b.display_order)
            .map((opt: any) => ({
              id: opt.id,
              text: opt.option_text,
              voteCount: countMap[opt.id] ?? 0,
            })),
        })),
      },
    });
  } catch (error) {
    console.error("[Android Polls] GET error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch polls" } }, { status: 500 });
  }
}
