import { handleApiError } from "@/lib/utils/api-error";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { FINANCE_VIEW_ROLES, hasAnyRole } from "@/lib/utils/roles";

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
    : (profile?.roles as { name: string } | undefined)?.name;
  if (!hasAnyRole(roleName as string, FINANCE_VIEW_ROLES)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { data: liquidations } = await supabase
      .from("finance_liquidations")
      .select(
        "*, finance_budget_requests(activity_title, amount), profiles(full_name)",
      )
      .eq("is_late", true)
      .order("submitted_at", { ascending: true });

    return NextResponse.json(liquidations || []);
  } catch (error) {
    return handleApiError(error);
  }
}
