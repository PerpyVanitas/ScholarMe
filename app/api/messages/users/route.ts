import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

    // Fetch profiles matching query
    let query = supabase
      .from("profiles")
      .select(
        `
        id,
        full_name,
        email,
        avatar_url,
        role_id,
        roles:role_id (
          name
        )
      `,
      )
      .neq("id", user.id);

    if (q) {
      query = query.ilike("full_name", `%${q}%`);
    }

    const { data: profiles, error } = await query
      .order("full_name", { ascending: true })
      .limit(20);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    // Format profiles to map the role name neatly
    const formatted = (profiles || []).map((p: any) => ({
      id: p.id,
      full_name: p.full_name,
      email: p.email,
      avatar_url: p.avatar_url,
      role: Array.isArray(p.roles)
        ? p.roles[0]?.name
        : p.roles?.name || "unknown",
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error("[messages/users] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
