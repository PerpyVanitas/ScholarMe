import { createClient, createAdminClient } from "@/lib/supabase/create-client";
import { NextRequest, NextResponse } from "next/server";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-errors";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        createErrorResponse(
          "AUTH_002_TOKEN_EXPIRED",
          "Authentication required",
        ),
        { status: 401 },
      );
    }

    // Verify caller is an administrator
    const { data: callerProfile, error: callerError } = await supabase
      .from("profiles")
      .select("roles(name)")
      .eq("id", user.id)
      .single();

    const isAdmin = Array.isArray(callerProfile?.roles)
      ? callerProfile.roles.some((role: { name: string }) =>
          ["administrator", "super_admin"].includes(role.name),
        )
      : ["administrator", "super_admin"].includes(
          (callerProfile?.roles as { name: string } | undefined)?.name || "",
        );

    if (callerError || !isAdmin) {
      return NextResponse.json(
        createErrorResponse(
          "AUTH_003_ADMIN_ONLY",
          "Only administrators can perform bulk imports",
        ),
        { status: 403 },
      );
    }

    const body = await request.json();
    const { users } = body;

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json(
        createErrorResponse(
          "VALID_001_GENERAL",
          "A valid array of users is required",
        ),
        { status: 400 },
      );
    }

    const adminClient = await createAdminClient();

    // Cache roles
    const { data: roles } = await adminClient.from("roles").select("id, name");
    const roleMap = new Map<string, string>();
    if (roles) {
      roles.forEach((r) => roleMap.set(r.name, r.id));
    }

    let successCount = 0;
    let failedCount = 0;
    const failures: { email: string; error: string }[] = [];

    // Process users
    for (const u of users) {
      try {
        const email = u.email;
        const full_name = u.full_name;
        let role_name = u.role_name || "learner";

        // Ensure role exists in map, default to learner if invalid
        let role_id = roleMap.get(role_name);
        if (!role_id) {
          role_name = "learner";
          role_id = roleMap.get("learner") || "";
        }

        // Check if email already exists
        const { data: existing } = await adminClient
          .from("profiles")
          .select("id")
          .eq("email", email)
          .maybeSingle();

        if (existing) {
          failedCount++;
          failures.push({ email, error: "Email already exists" });
          continue;
        }

        // Create the user
        const { error: createError } = await adminClient.auth.admin.createUser({
          email,
          password: "ScholarMe2026!", // Default temporary password
          email_confirm: true,
          user_metadata: {
            full_name,
            role_id,
            role_name,
          },
        });

        if (createError) {
          failedCount++;
          failures.push({ email, error: createError.message });
        } else {
          successCount++;
        }
      } catch (err: unknown) {
        failedCount++;
        failures.push({
          email: u.email,
          error:
            err instanceof Error ? err.message : String(err) || "Unknown error",
        });
      }
    }

    return NextResponse.json(
      {
        successCount,
        failedCount,
        failures,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("bulk-import error:", err);
    return NextResponse.json(
      createErrorResponse(
        "SYSTEM_001_UNKNOWN_ERROR",
        "An unexpected error occurred",
      ),
      { status: 500 },
    );
  }
}
