import { createSupabaseForBearer } from "@/lib/supabase/bearer-client";
import { type NextRequest, NextResponse } from "next/server";

function getBearerToken(request: Request): string | null {
  const h = request.headers.get("authorization");
  return h?.startsWith("Bearer ") ? h.substring(7) : null;
}

export async function GET(request: NextRequest) {
  try {
    const token = getBearerToken(request);
    if (!token) return NextResponse.json({ success: false }, { status: 401 });

    const supabase = createSupabaseForBearer(token);
    const { data: authData } = await supabase.auth.getUser(token);
    if (!authData.user) return NextResponse.json({ success: false }, { status: 401 });

    const { data: profile } = await supabase
        .from("profiles")
        .select("*, roles(name)")
        .eq("id", authData.user.id)
        .single();
    
    const roleName = Array.isArray(profile?.roles) ? profile.roles[0]?.name : (profile?.roles as any)?.name || "learner";

    const search = request.nextUrl.searchParams.get("search");

    let query = supabase
      .from("repositories")
      .select("*, profiles!repositories_owner_id_fkey(full_name), resources(count)")
      .order("created_at", { ascending: false });

    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    // Role-based filtering logic
    if (roleName === "learner") {
        query = query.eq("access_role", "all");
    } else if (roleName === "tutor") {
        query = query.in("access_role", ["all", "tutor"]);
    }

    const { data: repos, error } = await query;

    if (error) throw error;

    const mappedRepos = repos.map((r: any) => ({
      id: r.id,
      ownerId: r.owner_id,
      title: r.title,
      description: r.description,
      accessRole: r.access_role,
      createdAt: r.created_at,
      ownerName: r.profiles?.full_name || "Unknown",
      itemCount: r.resources?.[0]?.count || 0
    }));

    return NextResponse.json({
      success: true,
      data: mappedRepos
    });
  } catch (error) {
    console.error("[Android Resources] Failed to fetch repos:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
