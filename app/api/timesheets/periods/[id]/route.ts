import { handleApiError } from "@/lib/utils/api-error";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { GOVERNANCE_ROLES, hasAnyRole } from "@/lib/utils/roles";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("roles(name)")
      .eq("id", user.id)
      .single();

    const roleName = Array.isArray(profile?.roles)
      ? profile.roles[0]?.name
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      : (profile?.roles as any)?.name;
    const isAuthorized = hasAnyRole(roleName as string, GOVERNANCE_ROLES);

    if (!profile || !isAuthorized) {
      return NextResponse.json(
        { error: "Access denied - admin only" },
        { status: 403 },
      );
    }

    const adminClient = await createAdminClient();
    const { error } = await adminClient
      .from("semester_configs")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : String(error) },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
