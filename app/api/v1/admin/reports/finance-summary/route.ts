import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/utils/api-error";
import { GOVERNANCE_ROLES, hasAnyRole } from "@/lib/utils/roles";

async function getAdminUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("roles(name)")
    .eq("id", user.id)
    .single();

  const roleName = Array.isArray(profile?.roles)
    ? profile.roles[0]?.name
    : (profile?.roles as { name: string } | undefined)?.name;
  const isAuthorized = hasAnyRole(roleName as string, GOVERNANCE_ROLES);

  if (!isAuthorized) return null;
  return { user, roleName };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const adminData = await getAdminUser(supabase);
    if (!adminData) {
      return NextResponse.json(
        { error: "Forbidden", code: "AUTH_003_INSUFFICIENT_PERMISSIONS" },
        { status: 403 },
      );
    }

    // Example mock data or simplified query for the finance summary
    // Returns JSON: budget totals by category, pending/released counts
    const { data: records, error } = await supabase.from('finance_records').select('*');
    
    if (error) {
      return handleApiError(error, 500);
    }

    const budgetTotals: Record<string, number> = {};
    let pendingCount = 0;
    let releasedCount = 0;
    let totalAmount = 0;

    records?.forEach(record => {
      const cat = record.category || 'uncategorized';
      if (!budgetTotals[cat]) budgetTotals[cat] = 0;
      budgetTotals[cat] += Number(record.amount) || 0;
      totalAmount += Number(record.amount) || 0;

      if (record.status === 'pending') pendingCount++;
      if (record.status === 'released') releasedCount++;
    });

    const reportData = {
      timestamp: new Date().toISOString(),
      metrics: {
        total_budget_spent: totalAmount,
        pending_requests: pendingCount,
        released_requests: releasedCount,
      },
      budget_by_category: budgetTotals
    };

    return NextResponse.json({ success: true, data: reportData });
  } catch (error) {
    return handleApiError(error);
  }
}
