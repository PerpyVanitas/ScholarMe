import { handleApiError } from "@/lib/utils/api-error";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/create-client";
import { GOVERNANCE_ROLES, hasAnyRole } from "@/lib/utils/roles";
import { z } from "zod";
import { SupabaseClient } from "@supabase/supabase-js";

// Helper to fetch active timesheet collection period
async function getActivePeriod(supabase: SupabaseClient) {
  try {
    const { data } = await supabase
      .from("timesheet_periods")
      .select("*")
      .eq("is_active", true)
      .single();
    return data;
  } catch (e) {
    return null;
  }
}

const searchParamsSchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

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
  const parsedSearchParams = Object.fromEntries(searchParams.entries());

  const validationResult = searchParamsSchema.safeParse(parsedSearchParams);

  if (!validationResult.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { start_date: startDateParam, end_date: endDateParam, page: pageStr, limit: limitStr } = validationResult.data;

  const page = parseInt(pageStr || "1", 10);
  const limit = parseInt(limitStr || "100", 10);
  const offset = (page - 1) * limit;

  let query = supabase.from("timesheets").select("*, tutors(*, profiles(*))", { count: "exact" });

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

  const { data, error, count } = await query
    .order("clock_in", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return handleApiError(error);
  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total: count || 0
    }
  });
}
