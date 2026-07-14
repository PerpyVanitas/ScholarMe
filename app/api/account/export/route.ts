import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const userId = user.id;

  const [profile, studySets, learnerSessions, designations, quizAttempts] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("study_sets").select("*").eq("user_id", userId),
      supabase.from("sessions").select("*").eq("learner_id", userId),
      supabase.from("hs_designations").select("*").eq("user_id", userId),
      supabase.from("quiz_attempts").select("*").eq("user_id", userId),
    ]);

  const exportData = {
    generated_at: new Date().toISOString(),
    user: user,
    profile: profile.data,
    designations: designations.data,
    study_sets: studySets.data,
    sessions: learnerSessions.data,
    quiz_attempts: quizAttempts.data,
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="scholarme_data_export_${userId}.json"`,
    },
  });
}
