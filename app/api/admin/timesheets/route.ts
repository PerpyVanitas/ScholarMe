import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/create-client";
import { GOVERNANCE_ROLES, hasAnyRole } from "@/lib/utils/roles";

// Helper to fetch active timesheet collection period
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getActivePeriod(supabase: any) {
  try {
    const { data } = await supabase
      .from("timesheet_periods")
      .select("start_date, end_date")
      .eq("is_active", true)
      .maybeSingle();
    return data || null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  // Verify admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("roles(name)")
    .eq("id", user.id)
    .single();

  const roleName = Array.isArray(profile?.roles)
    ? profile.roles[0]?.name
    : (profile?.roles as { name: string } | undefined)?.name;
  const isAuthorized = hasAnyRole(roleName as string, GOVERNANCE_ROLES);

  if (!profile || !isAuthorized) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const startDateParam = searchParams.get("start_date");
  const endDateParam = searchParams.get("end_date");

  let query = supabase.from("timesheets").select("*, tutors(*, profiles(*))");

  if (startDateParam && endDateParam) {
    query = query.gte("clock_in", startDateParam).lte("clock_in", endDateParam);
  } else {
    const config = await getActivePeriod(supabase);
    if (config && config.start_date && config.end_date) {
      query = query
        .gte("clock_in", config.start_date)
        .lte("clock_in", config.end_date);
    }
  }

  const { data, error } = await query.order("clock_in", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
