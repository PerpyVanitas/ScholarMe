import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MentorshipClient } from "./components/mentorship-client";

export const metadata = {
  title: "Mentorship Matching - ScholarMe",
};

export default async function MentorshipMatchingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/auth/onboarding");

  // Fetch mentorship preferences
  const { data: pref } = await supabase
    .from("mentorship_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Fetch potential mentorship matches
  // If user year_level <= 2: surface mentors (year_level >= 3)
  // If user year_level >= 3: surface mentees (year_level <= 2)
  const isSenior = (profile.year_level || 1) >= 3;
  const targetYearLevelCondition = isSenior ? [1, 2] : [3, 4, 5];

  const { data: matches } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, degree_program, year_level, bio")
    .in("year_level", targetYearLevelCondition)
    .neq("id", user.id)
    .limit(20);

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-6">
      <MentorshipClient
        profile={profile}
        initialPref={pref}
        initialMatches={matches || []}
        isSenior={isSenior}
      />
    </div>
  );
}
