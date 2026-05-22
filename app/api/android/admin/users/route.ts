import { createSupabaseForBearer } from "@/lib/supabase/bearer-client";
import { getRoleName } from "@/lib/utils/roles";
import { createAdminClient } from "@/lib/supabase/create-client";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
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

    const supabase = await createAdminClient();
    
    // Fetch real users from the profiles table
    const { data: users, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url, roles(name)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
      return NextResponse.json({ success: false, message: "Database error" }, { status: 500 });
    }

    const formattedUsers = users.map(u => ({
      id: u.id,
      fullName: u.full_name,
      email: u.email,
      avatarUrl: u.avatar_url,
      role: getRoleName(u) || "learner"
    }));

    return NextResponse.json({ success: true, data: formattedUsers });
  } catch (error) {
    console.error("[Android Admin API] Fetch users error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
