import { createSupabaseForBearer } from "@/lib/supabase/bearer-client";
import { getRoleName } from "@/lib/utils/roles";
import { createAdminClient } from "@/lib/supabase/create-client";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Missing token" }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const authSupabase = createSupabaseForBearer(token);
    const { data: { user }, error: userError } = await authSupabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
    }
    const { data: profile } = await authSupabase.from("profiles").select("*, roles(name)").eq("id", user.id).single();
    if (getRoleName(profile) !== "administrator") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const supabase = await createAdminClient();


    const { count: totalUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true });
    const { count: totalSessions } = await supabase.from("sessions").select("*", { count: "exact", head: true });
    const { count: pendingSessions } = await supabase.from("sessions").select("*", { count: "exact", head: true }).eq("status", "pending");
    
    // Calculate success rate based on completed vs total
    const { count: completedSessions } = await supabase.from("sessions").select("*", { count: "exact", head: true }).eq("status", "completed");
    
    const successRate = totalSessions && totalSessions > 0 && completedSessions 
      ? Math.round((completedSessions / totalSessions) * 100) 
      : 0;

    // Get real recent user signups for growth chart (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: recentUsers } = await supabase
      .from("profiles")
      .select("created_at")
      .gte("created_at", sevenDaysAgo.toISOString());

    // Basic aggregation for chart
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const growthMap = new Map<string, number>();
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        growthMap.set(days[d.getDay()], 0);
    }
    
    recentUsers?.forEach(u => {
        if (u.created_at) {
            const dayName = days[new Date(u.created_at).getDay()];
            if (growthMap.has(dayName)) {
                growthMap.set(dayName, growthMap.get(dayName)! + 1);
            }
        }
    });

    const userGrowth = Array.from(growthMap.entries())
        .reverse()
        .map(([label, value]) => ({ label, value }));

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue: 0, // Need stripe integration for real revenue
        userGrowth: userGrowth,
        sessionSuccessRate: successRate,
        topSpecializations: [
          { name: "Platform Users", count: totalUsers || 0 },
          { name: "Total Sessions", count: totalSessions || 0 },
          { name: "Pending Sessions", count: pendingSessions || 0 }
        ]
      }
    });
  } catch (error) {
    console.error("[Android Admin API] Analytics error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch analytics" }, { status: 500 });
  }
}
