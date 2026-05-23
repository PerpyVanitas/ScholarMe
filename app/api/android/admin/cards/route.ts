import { createAdminClient } from "@/lib/supabase/create-client";
import { createSupabaseForBearer } from "@/lib/supabase/bearer-client";
import { getRoleName } from "@/lib/utils/roles";
import { NextResponse } from "next/server";

async function validateAndroidAdmin(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return { isAdmin: false, admin: null };
  const token = authHeader.substring(7);
  const authSupabase = createSupabaseForBearer(token);
  const { data: { user } } = await authSupabase.auth.getUser(token);
  if (!user) return { isAdmin: false, admin: null };
  const { data: profile } = await authSupabase.from("profiles").select("*, roles(name)").eq("id", user.id).single();
  if (getRoleName(profile) !== "administrator") return { isAdmin: false, admin: null };
  return { isAdmin: true, admin: { user, profile } };
}

export async function GET(request: Request) {
  try {
    const { isAdmin } = await validateAndroidAdmin(request);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const supabase = await createAdminClient();

    const { data: cards, error } = await supabase
      .from("auth_cards")
      .select(`
        *,
        profiles:user_id(full_name)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const formatted = (cards ?? []).map((c: any) => ({
      id: c.id,
      cardId: c.card_id,
      userId: c.user_id,
      status: c.status,
      createdAt: c.created_at,
      userName: c.profiles?.full_name || "Unknown"
    }));

    return NextResponse.json({
      success: true,
      data: formatted
    });
  } catch (error) {
    console.error("[Android Admin API] Cards list error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch cards" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { isAdmin } = await validateAndroidAdmin(request);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const body = await request.json();
    const supabase = await createAdminClient();

    // Handling card issue toggle
    if (body.is_card_issued !== undefined && body.user_id) {
      const { data, error } = await supabase
        .from("profiles")
        .update({ is_card_issued: body.is_card_issued })
        .eq("id", body.user_id)
        .select()
        .single();
      
      if (error) throw error;

      return NextResponse.json({ success: true, data });
    }

    // Original auth_card insert
    const { userId, cardId, pin } = body;
    const { data, error } = await supabase
      .from("auth_cards")
      .insert({ user_id: userId, card_id: cardId, pin })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[Android Admin API] Card issue error:", error);
    return NextResponse.json({ success: false, message: "Failed to issue card" }, { status: 500 });
  }
}
