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

    // Example mock data or simplified query for the semester summary
    // Returns JSON: user counts, total sessions, system health
    const { count: usersCount, error: usersError } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: sessionsCount, error: sessionsError } = await supabase.from('sessions').select('*', { count: 'exact', head: true });

    if (usersError || sessionsError) {
      return handleApiError(usersError || sessionsError, 500);
    }

    const reportData = {
      timestamp: new Date().toISOString(),
      metrics: {
        total_registered_users: usersCount || 0,
        total_sessions_conducted: sessionsCount || 0,
      }
    };

    return NextResponse.json({ success: true, data: reportData });
  } catch (error) {
    return handleApiError(error);
  }
}
