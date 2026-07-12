import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
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

    const adminAuthClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: profile } = await adminAuthClient
      .from("profiles")
      .select("role_expires_at, roles(name)")
      .eq("id", user.id)
      .single();

    if (!profile || !profile.role_expires_at) {
      return NextResponse.json({ success: true, message: "No expiration" });
    }

    if (new Date(profile.role_expires_at) < new Date()) {
      const { data: learnerRole } = await adminAuthClient
        .from("roles")
        .select("id")
        .eq("name", "learner")
        .single();
        
      if (learnerRole) {
        await adminAuthClient
          .from("profiles")
          .update({
            role_id: learnerRole.id,
            role_expires_at: null,
          })
          .eq("id", user.id);
          
        return NextResponse.json({ success: true, reverted: true });
      }
    }

    return NextResponse.json({ success: true, reverted: false });
  } catch (error: any) {
    console.error("Error reverting role:", error);
    return NextResponse.json(
      { error: error.message || "Failed to revert role" },
      { status: 500 }
    );
  }
}
