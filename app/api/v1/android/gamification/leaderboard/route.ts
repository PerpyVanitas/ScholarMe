import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const QuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parsedParams = QuerySchema.safeParse(
      Object.fromEntries(searchParams.entries()),
    );
    if (!parsedParams.success) {
      return NextResponse.json(
        { success: false, error: "Invalid query parameters" },
        { status: 400 },
      );
    }
    const { limit } = parsedParams.data;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { data: profilesData, error } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, total_xp, current_level")
      .order("total_xp", { ascending: false });

    if (error) {
      throw error;
    }

    const leaderboard = (profilesData || []).map(
      (entry: Record<string, unknown>, index: number) => {
        const nestedProfile = Array.isArray(entry.profiles)
          ? entry.profiles[0]
          : (entry.profiles as Record<string, unknown> | undefined);

        const id = (entry.id as string) || (entry.user_id as string) || "";
        const fullName =
          (entry.full_name as string) ||
          (nestedProfile?.full_name as string) ||
          "Unknown User";
        const avatarUrl =
          (entry.avatar_url as string) ||
          (nestedProfile?.avatar_url as string) ||
          null;
        const totalXp =
          typeof entry.total_xp === "number"
            ? entry.total_xp
            : typeof entry.experience_points === "number"
              ? entry.experience_points
              : 0;
        const currentLevel =
          typeof entry.current_level === "number"
            ? entry.current_level
            : typeof entry.level === "number"
              ? entry.level
              : 1;

        return {
          rank: index + 1,
          id,
          fullName,
          avatarUrl,
          totalXp,
          currentLevel,
          isCurrentUser: id === user.id,
        };
      },
    );

    const topEntries = leaderboard.slice(0, limit);
    const currentUserEntry = leaderboard.find((e) => e.id === user.id);

    return NextResponse.json({
      success: true,
      data: {
        leaderboard: topEntries,
        currentUserEntry:
          currentUserEntry && currentUserEntry.rank > limit
            ? currentUserEntry
            : null,
      },
    });
  } catch (error: unknown) {
    console.error("Leaderboard API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || "Failed to fetch leaderboard",
      },
      { status: 500 },
    );
  }
}
