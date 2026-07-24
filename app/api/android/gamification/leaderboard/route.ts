import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const QuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parsedParams = QuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!parsedParams.success) {
      return NextResponse.json({ success: false, error: "Invalid query parameters" }, { status: 400 });
    }
    const { limit } = parsedParams.data;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: gamificationData, error } = await supabase
      .from("gamification_profiles")
      .select(`
        user_id,
        experience_points,
        level,
        profiles!gamification_profiles_user_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .order("experience_points", { ascending: false });

    if (error) {
      throw error;
    }

    const leaderboard = gamificationData
      .map((entry: Record<string, unknown>, index: number) => {
        const profile = Array.isArray(entry.profiles) ? entry.profiles[0] : entry.profiles;
        return {
          rank: index + 1,
          id: entry.user_id,
          fullName: profile?.full_name || "Unknown User",
          avatarUrl: profile?.avatar_url || null,
          totalXp: entry.experience_points,
          currentLevel: entry.level,
          isCurrentUser: entry.user_id === user.id
        };
      });

    const topEntries = leaderboard.slice(0, limit);
    const currentUserEntry = leaderboard.find(e => e.id === user.id);

    return NextResponse.json({
      success: true,
      data: {
        leaderboard: topEntries,
        currentUserEntry: currentUserEntry && currentUserEntry.rank > limit ? currentUserEntry : null
      }
    });

  } catch (error: unknown) {
    console.error("Leaderboard API Error:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
