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

    const { data: reports, error } = await supabase
      .from("forum_reports")
      .select(`
        *,
        forum_posts (
          title,
          content,
          author_id
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      return handleApiError(error, 500);
    }

    return NextResponse.json({ success: true, data: { reports } });
  } catch (error) {
    return handleApiError(error);
  }
}
