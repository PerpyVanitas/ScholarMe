import { handleApiError } from "@/lib/utils/api-error";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { GOVERNANCE_ROLES, hasAnyRole } from "@/lib/utils/roles";
import { z } from "zod";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("semester_configs")
      .select("id, name, start_date, end_date, is_active")
      .order("start_date", { ascending: false });

    if (error) {
      // Return empty array if table doesn't exist yet
      console.warn(
        "Could not fetch timesheet periods:",
        error instanceof Error ? error.message : String(error),
      );
      return NextResponse.json([]);
    }

    return NextResponse.json(data || []);
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

const createSemesterConfigSchema = z.object({
  name: z.string().min(1, "Name is required"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
});

export async function POST(req: Request) {
  try {
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
      : ((profile?.roles as unknown as Record<string, unknown> | null)?.name as
          string | undefined);
    const isAuthorized = hasAnyRole(roleName as string, GOVERNANCE_ROLES);

    if (!profile || !isAuthorized) {
      return NextResponse.json(
        { error: "Access denied - admin only" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const validation = createSemesterConfigSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { name, start_date, end_date } = validation.data;

    const adminClient = await createAdminClient();
    const { data, error } = await adminClient
      .from("semester_configs")
      .insert({
        name,
        start_date: new Date(start_date).toISOString(),
        end_date: new Date(end_date).toISOString(),
        is_active: false, // default to false, admin will activate it explicitly
      })
      .select("id, name, start_date, end_date, is_active")
      .single();

    if (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : String(error) },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
