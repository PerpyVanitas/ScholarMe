import { createAdminClient } from "@/lib/supabase/create-client";
import { validateAdmin } from "@/lib/auth-utils";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { isAdmin } = await validateAdmin();
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
    const { isAdmin } = await validateAdmin();
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { userId, cardId, pin } = await request.json();

    const supabase = await createAdminClient();
    
    const { data, error } = await supabase
      .from("auth_cards")
      .insert({ user_id: userId, card_id: cardId, pin })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error("[Android Admin API] Card issue error:", error);
    return NextResponse.json({ success: false, message: "Failed to issue card" }, { status: 500 });
  }
}
