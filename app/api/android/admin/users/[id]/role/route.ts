import { createSupabaseForBearer } from "@/lib/supabase/bearer-client";
import { getRoleName } from "@/lib/utils/roles";
import { createAdminClient } from "@/lib/supabase/create-client";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Missing token" }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const authSupabase = createSupabaseForBearer(token);
    
    const { data: { user }, error: userError } = await authSupabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
    }
    
    const { data: profile } = await authSupabase
      .from("profiles")
      .select("*, roles(name)")
      .eq("id", user.id)
      .single();
      
    if (getRoleName(profile) !== "administrator") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { role } = await request.json();
    if (!role) {
      return NextResponse.json({ success: false, message: "Missing role" }, { status: 400 });
    }

    const supabase = await createAdminClient();
    
    // Get role id
    const { data: roleData } = await supabase
      .from("roles")
      .select("id")
      .eq("name", role)
      .single();

    if (!roleData) {
      return NextResponse.json({ success: false, message: "Invalid role" }, { status: 400 });
    }

    // Update profile role
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ role_id: roleData.id })
      .eq("id", params.id);

    if (updateError) {
      return NextResponse.json({ success: false, message: "Database error" }, { status: 500 });
    }
    
    // Handle tutor record
    if (role === "tutor") {
      await supabase.from("tutors").upsert({ user_id: params.id }, { onConflict: "user_id" });
    } else {
      await supabase.from("tutors").delete().eq("user_id", params.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Android Admin API] Update role error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
