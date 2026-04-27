import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LeaderboardTable } from "@/components/gamification/leaderboard-table";

export const metadata = {
  title: "Leaderboard | ScholarMe",
  description: "Global Learner Rankings",
};

export default async function LeaderboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch top 50 users based on total_xp, ensuring they are learners (or we just show all users)
  // For the MVP we will query the profiles table and sort by total_xp
  const { data: topProfiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, total_xp, current_level, profile_theme_color")
    .order("total_xp", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error fetching leaderboard:", error);
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Global Leaderboard</h1>
        <p className="text-muted-foreground mt-2">
          Rank up by passing quizzes and attending sessions. Higher levels unlock exclusive profile themes!
        </p>
      </div>

      <LeaderboardTable profiles={topProfiles || []} currentUserId={user.id} />
    </div>
  );
}
