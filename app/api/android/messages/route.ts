import { createClient } from "@/lib/supabase/create-client";
import { NextResponse } from "next/server";

function getBearerToken(request: Request): string | null {
  const h = request.headers.get("authorization");
  return h?.startsWith("Bearer ") ? h.substring(7) : null;
}

async function getAuthUser(token: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser(token);
  return { supabase, user: error ? null : data.user };
}

/** GET /api/android/messages — list conversations for authenticated user */
export async function GET(request: Request) {
  try {
    const token = getBearerToken(request);
    if (!token) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Missing token" } }, { status: 401 });

    const { supabase, user } = await getAuthUser(token);
    if (!user) return NextResponse.json({ success: false, error: { code: "INVALID_TOKEN", message: "Invalid token" } }, { status: 401 });

    // Get all conversations the user participates in
    const { data: participations, error } = await supabase
      .from("conversation_participants")
      .select(
        `conversation_id,
         last_read_at,
         conversations(id, title, created_at, updated_at,
           messages(id, content, created_at, sender_id)
         )`
      )
      .eq("profile_id", user.id)
      .order("conversations(updated_at)", { ascending: false });

    if (error) throw error;

    // Get other participants for each conversation to build titles
    const conversations = await Promise.all(
      (participations ?? []).map(async (p: any) => {
        const conv = p.conversations;
        if (!conv) return null;

        // Get other participants
        const { data: otherParts } = await supabase
          .from("conversation_participants")
          .select("profile_id, profiles(full_name, avatar_url)")
          .eq("conversation_id", conv.id)
          .neq("profile_id", user.id)
          .limit(3);

        // Count unread messages
        const { count: unreadCount } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", conv.id)
          .gt("created_at", p.last_read_at ?? "1970-01-01");

        // Get last message
        const messages = Array.isArray(conv.messages) ? conv.messages : [];
        const lastMsg = messages.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

        const otherNames = (otherParts ?? []).map((op: any) => (op as any).profiles?.full_name ?? "Unknown");
        const displayTitle = conv.title ?? otherNames.join(", ") ?? "Conversation";
        const avatarUrl = (otherParts ?? [])[0] ? (otherParts![0] as any).profiles?.avatar_url : null;

        return {
          id: conv.id,
          title: displayTitle,
          lastMessage: lastMsg?.content ?? null,
          lastMessageAt: lastMsg?.created_at ?? conv.updated_at,
          updatedAt: conv.updated_at,
          unreadCount: unreadCount ?? 0,
          avatarUrl,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: { conversations: conversations.filter(Boolean) },
    });
  } catch (error) {
    console.error("[Android Messages] GET error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch conversations" } }, { status: 500 });
  }
}

/** POST /api/android/messages — create a new conversation */
export async function POST(request: Request) {
  try {
    const token = getBearerToken(request);
    if (!token) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Missing token" } }, { status: 401 });

    const { supabase, user } = await getAuthUser(token);
    if (!user) return NextResponse.json({ success: false, error: { code: "INVALID_TOKEN", message: "Invalid token" } }, { status: 401 });

    const { participantIds, title, firstMessage } = await request.json();
    if (!participantIds?.length) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "participantIds required" } }, { status: 400 });
    }

    // Create conversation
    const { data: conv, error: convError } = await supabase
      .from("conversations")
      .insert({ title: title ?? null })
      .select()
      .single();
    if (convError) throw convError;

    // Add all participants (including self)
    const allParticipants = [...new Set([user.id, ...participantIds])];
    await supabase.from("conversation_participants").insert(
      allParticipants.map((pid: string) => ({ conversation_id: conv.id, profile_id: pid }))
    );

    // Send first message if provided
    if (firstMessage?.trim()) {
      await supabase.from("messages").insert({
        conversation_id: conv.id,
        sender_id: user.id,
        content: firstMessage.trim(),
      });
    }

    return NextResponse.json({ success: true, data: { conversationId: conv.id } }, { status: 201 });
  } catch (error) {
    console.error("[Android Messages] POST error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to create conversation" } }, { status: 500 });
  }
}
