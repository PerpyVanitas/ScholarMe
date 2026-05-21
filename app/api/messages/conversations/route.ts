import { createClient } from "@/lib/supabase/server";
import { createClient as createSimpleAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { participantId } = await req.json();
    if (!participantId) {
      return NextResponse.json({ success: false, error: "Participant ID is required" }, { status: 400 });
    }

    const adminSupabase = createSimpleAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Check if a 1-on-1 conversation already exists between these two users
    const { data: existingConvs, error: checkError } = await adminSupabase
      .from("conversation_participants")
      .select("conversation_id")
      .in("profile_id", [user.id, participantId]);

    if (checkError) {
      return NextResponse.json({ success: false, error: checkError.message }, { status: 500 });
    }

    // Group by conversation_id to see which conversation has both participants
    const counts: Record<string, number> = {};
    let existingConvId: string | null = null;
    
    for (const p of existingConvs || []) {
      counts[p.conversation_id] = (counts[p.conversation_id] || 0) + 1;
      if (counts[p.conversation_id] === 2) {
        existingConvId = p.conversation_id;
        break;
      }
    }

    if (existingConvId) {
      // Fetch full details of the existing conversation
      const { data: conv, error: fetchError } = await adminSupabase
        .from("conversations")
        .select(`
          *,
          conversation_participants(
            profile_id,
            last_read_at,
            profiles(id, full_name, avatar_url, role_id)
          ),
          messages(
            id,
            content,
            created_at,
            sender_id
          )
        `)
        .eq("id", existingConvId)
        .single();

      if (!fetchError && conv) {
        // Sort messages to get the latest one
        const sortedMessages = conv.messages?.sort(
          (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        return NextResponse.json({
          success: true,
          conversation: { ...conv, messages: sortedMessages },
          existing: true
        });
      }
    }

    // 2. Create a new conversation
    const { data: newConv, error: convError } = await adminSupabase
      .from("conversations")
      .insert({ title: null })
      .select()
      .single();

    if (convError || !newConv) {
      return NextResponse.json({ success: false, error: convError?.message || "Failed to create conversation" }, { status: 500 });
    }

    // 3. Add participants
    const participantsData = [
      { conversation_id: newConv.id, profile_id: user.id },
      { conversation_id: newConv.id, profile_id: participantId }
    ];

    const { error: partError } = await adminSupabase
      .from("conversation_participants")
      .insert(participantsData);

    if (partError) {
      await adminSupabase.from("conversations").delete().eq("id", newConv.id);
      return NextResponse.json({ success: false, error: partError.message }, { status: 500 });
    }

    // 4. Fetch the newly created conversation with participants
    const { data: createdConv, error: finalError } = await adminSupabase
      .from("conversations")
      .select(`
        *,
        conversation_participants(
          profile_id,
          last_read_at,
          profiles(id, full_name, avatar_url, role_id)
        ),
        messages(
          id,
          content,
          created_at,
          sender_id
        )
      `)
      .eq("id", newConv.id)
      .single();

    if (finalError || !createdConv) {
      return NextResponse.json({ success: false, error: finalError?.message || "Failed to retrieve new conversation" }, { status: 500 });
    }

    return NextResponse.json({ success: true, conversation: createdConv, existing: false });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
