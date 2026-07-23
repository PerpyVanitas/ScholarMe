import { handleApiError } from "@/lib/utils/api-error";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { GOVERNANCE_ROLES, getRoleName, hasAnyRole } from "@/lib/utils/roles";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { z } from "zod";

const magicLinkBodySchema = z.object({
  email: z.string().email(),
});

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

    const bodyResult = magicLinkBodySchema.safeParse(await request.json());

    if (!bodyResult.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { email } = bodyResult.data;

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
    return handleApiError(message);
  }
}
