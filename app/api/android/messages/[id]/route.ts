import { createSupabaseForBearer } from "@/lib/supabase/bearer-client";
import { NextResponse } from "next/server";

function getBearerToken(request: Request): string | null {
  const h = request.headers.get("authorization");
  return h?.startsWith("Bearer ") ? h.substring(7) : null;
}

/** GET /api/android/messages/[id] — get messages in a conversation */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = getBearerToken(request);
    if (!token) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Missing token" } }, { status: 401 });

    const supabase = createSupabaseForBearer(token);
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData.user) return NextResponse.json({ success: false, error: { code: "INVALID_TOKEN", message: "Invalid token" } }, { status: 401 });

    // Verify user is participant
    const { data: participant } = await supabase
      .from("conversation_participants")
      .select("profile_id")
      .eq("conversation_id", id)
      .eq("profile_id", authData.user.id)
      .maybeSingle();

    if (!participant) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Not a participant in this conversation" } }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "50", 10));

    const { data: messages, error } = await supabase
      .from("messages")
      .select("id, content, sender_id, created_at, is_edited, profiles!sender_id(full_name, avatar_url)")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) throw error;

    // Mark as read
    await supabase
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", id)
      .eq("profile_id", authData.user.id);

    return NextResponse.json({
      success: true,
      data: {
        conversationId: id,
        messages: (messages ?? []).map((m: any) => ({
          id: m.id,
          content: m.content,
          senderId: m.sender_id,
          senderName: m.profiles?.full_name ?? "Unknown",
          senderAvatar: m.profiles?.avatar_url ?? null,
          createdAt: m.created_at,
          isEdited: m.is_edited ?? false,
          isOwn: m.sender_id === authData.user!.id,
        })),
      },
    });
  } catch (error) {
    console.error("[Android Messages] GET [id] error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch messages" } }, { status: 500 });
  }
}

/** POST /api/android/messages/[id] — send a message in a conversation */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = getBearerToken(request);
    if (!token) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Missing token" } }, { status: 401 });

    const supabase = createSupabaseForBearer(token);
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData.user) return NextResponse.json({ success: false, error: { code: "INVALID_TOKEN", message: "Invalid token" } }, { status: 401 });

    const { content } = await request.json();
    if (!content?.trim()) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Message content cannot be empty" } }, { status: 400 });
    }

    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: id,
        sender_id: authData.user.id,
        content: content.trim(),
      })
      .select("id, content, sender_id, created_at, profiles!sender_id(full_name, avatar_url)")
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: {
        id: message.id,
        content: message.content,
        senderId: message.sender_id,
        senderName: (message as any).profiles?.full_name ?? "Unknown",
        senderAvatar: (message as any).profiles?.avatar_url ?? null,
        createdAt: message.created_at,
        isOwn: true,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("[Android Messages] POST [id] error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to send message" } }, { status: 500 });
  }
}
