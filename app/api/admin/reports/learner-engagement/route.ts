import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminRole } from "@/lib/utils/roles";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("roles(name)")
    .eq("id", user.id)
    .single();
  const roleName = Array.isArray(profile?.roles)
    ? profile.roles[0]?.name
    : (profile?.roles as any)?.name;
  if (!isAdminRole(roleName as string)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { data: sessions } = await supabase
      .from("sessions")
      .select("learner_id")
      .not("status", "eq", "cancelled");

    const safeS = sessions ?? [];
    const learnerCounts = new Map<string, number>();

    for (const s of safeS) {
      const existing = learnerCounts.get(s.learner_id) || 0;
      learnerCounts.set(s.learner_id, existing + 1);
    }

    let zeroSessions = 0; // would require joining profiles to know total learners
    let oneToThree = 0;
    let fourPlus = 0;

    for (const count of Array.from(learnerCounts.values())) {
      if (count >= 1 && count <= 3) oneToThree++;
      else if (count >= 4) fourPlus++;
    }

    // Estimate zero sessions by total learners minus those who booked
    const { count: totalLearners } = await supabase
      .from("profiles")
      .select("id", { count: "exact" });

    if (totalLearners) {
      zeroSessions = Math.max(0, totalLearners - learnerCounts.size);
    }

    return NextResponse.json({
      zeroSessions,
      oneToThree,
      fourPlus,
      totalActive: learnerCounts.size,
    });
  } catch (error) {
    console.error("Learner engagement error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
