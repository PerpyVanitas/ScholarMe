import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { GOVERNANCE_ROLES, getRoleName, hasAnyRole } from "@/lib/utils/roles";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin access
    const { data: profile } = await supabase
      .from("profiles")
      .select("roles!inner(name)")
      .eq("id", user.id)
      .single();

    const role = getRoleName(profile ?? { roles: [] });
    if (role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const adminAuthClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    const { data, error } = await adminAuthClient.auth.admin.generateLink({
      type: "magiclink",
      email: email,
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({ link: data.properties.action_link });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    console.error("Error generating impersonation link:", message);
    return NextResponse.json(
      { error: message || "Failed to generate link" },
      { status: 500 },
    );
  }
}
