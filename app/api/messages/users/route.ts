import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type UserProfileRow = {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  roles?: { name: string } | { name: string }[] | null;
};

function formatProfile(p: UserProfileRow) {
  return {
    id: p.id,
    full_name: p.full_name,
    email: p.email,
    avatar_url: p.avatar_url,
    role: Array.isArray(p.roles)
      ? p.roles[0]?.name
      : p.roles?.name || "unknown",
  };
}

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
    const userId = searchParams.get("userId");

    if (userId) {
      const { data: profile, error } = await supabase
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
        .eq("id", userId)
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 },
        );
      }

      if (!profile) {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({ success: true, data: formatProfile(profile) });
    }

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

    const formatted = (profiles || []).map((profile: UserProfileRow) =>
      formatProfile(profile),
    );

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: unknown) {
    console.error("[messages/users] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
