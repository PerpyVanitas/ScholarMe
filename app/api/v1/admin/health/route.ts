import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { validateAdmin } from "@/lib/auth-utils";

export async function GET() {
  const { isAdmin } = await validateAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();

  const tables = [
    "profiles",
    "sessions",
    "study_sets",
    "study_groups",
    "forum_posts",
    "facility_events",
    "analytics_logs",
    "finance_budget_requests",
  ] as const;

  const counts: Record<string, number> = {};
  await Promise.all(
    tables.map(async (table) => {
      const { count } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });
      counts[table] = count ?? 0;
    }),
  );

  const { count: activeSessions } = await supabase
    .from("sessions")
    .select("*", { count: "exact", head: true })
    .in("status", ["pending", "confirmed"]);

  let overdueCheckouts = 0;
  const overdueRes = await supabase
    .from("resource_checkouts")
    .select("*", { count: "exact", head: true })
    .eq("status", "overdue");
  if (!overdueRes.error) overdueCheckouts = overdueRes.count ?? 0;

  const totalRows = Object.values(counts).reduce((a, b) => a + b, 0);
  const dbMax = 500;
  const estimatedDbMb = Math.round((totalRows / 10000) * dbMax * 10) / 10;

  return NextResponse.json({
    status: "operational",
    counts,
    totalRows,
    dbSize: Math.min(estimatedDbMb, dbMax),
    dbMax,
    activeSessions: activeSessions ?? 0,
    overdueCheckouts: overdueCheckouts ?? 0,
    generatedAt: new Date().toISOString(),
  });
}
