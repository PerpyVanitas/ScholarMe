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
    const { data: liquidations } = await supabase
      .from("finance_liquidations")
      .select(
        "*, finance_budget_requests(activity_title, amount), profiles(full_name)",
      )
      .eq("is_late", true)
      .order("submitted_at", { ascending: true });

    return NextResponse.json(liquidations || []);
  } catch (error) {
    console.error("Late liquidations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
