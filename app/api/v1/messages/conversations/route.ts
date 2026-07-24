import { handleApiError } from "@/lib/utils/api-error";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSimpleAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod"; // Added this line
import { rateLimit } from "@/lib/rate-limit";

const conversationRateLimiter = rateLimit({ interval: 60 * 1000, limit: 10 });

export async function POST(req: Request) {
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

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const limitRes = await conversationRateLimiter.check(`conv:${user.id}:${ip}`);
    if (!limitRes.success) {
      return NextResponse.json(
        { success: false, error: "Too many requests" },
        { status: 429 },
      );
    }

    // Zod schema for the request body
    const postBodySchema = z.object({
      participantId: z.string().uuid(), // Assuming participantId is a UUID string based on typical Supabase profile_id
    });

    const body = await req.json();
    const validation = postBodySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { participantId } = validation.data;
    // Original check `if (!participantId)` is now redundant due to `z.string().uuid()` validation.

    const adminSupabase = createSimpleAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // 1. Check if a 1-on-1 conversation already exists between these two users.
    // We also check total participant count to avoid matching group conversations.
    const { data: existingConvs, error: checkError } = await adminSupabase
      .from("conversation_participants")
      .select("conversation_id")
      .in("profile_id", [user.id, participantId]);

    if (checkError) {
      return NextResponse.json(
        { success: false, error: checkError.message },
        { status: 500 },
      );
    }

    // Group by conversation_id to find which ones include BOTH users
    const counts: Record<string, number> = {};
    const candidateConvIds: string[] = [];

    for (const p of existingConvs || []) {
      counts[p.conversation_id] = (counts[p.conversation_id] || 0) + 1;
      if (counts[p.conversation_id] === 2) {
        candidateConvIds.push(p.conversation_id);
      }
    }

    // Filter candidates to only 1-on-1 conversations (exactly 2 total participants)
    let existingConvId: string | null = null;
    if (candidateConvIds.length > 0) {
      const { data: participantCounts } = await adminSupabase
        .from("conversation_participants")
        .select("conversation_id")
        .in("conversation_id", candidateConvIds);

      const totalCounts: Record<string, number> = {};
      for (const p of participantCounts || []) {
        totalCounts[p.conversation_id] =
          (totalCounts[p.conversation_id] || 0) + 1;
      }
      // Only a true 1-on-1 conversation has exactly 2 participants
      existingConvId =
        candidateConvIds.find((id) => totalCounts[id] === 2) ?? null;
    }

    if (existingConvId) {
      // Fetch full details of the existing conversation
      const { data: conv, error: fetchError } = await adminSupabase
        .from("conversations")
        .select(
          `
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
        `,
        )
        .eq("id", existingConvId)
        .single();

      if (!fetchError && conv) {
        // Sort messages chronologically
        type RawMessage = {
          id: string;
          content: string;
          created_at: string;
          sender_id: string;
        };
        const sortedMessages = (
          conv.messages as RawMessage[] | undefined
        )?.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );
        return NextResponse.json({
          success: true,
          conversation: { ...conv, messages: sortedMessages },
          existing: true,
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
      return NextResponse.json(
        {
          success: false,
          error: convError?.message || "Failed to create conversation",
        },
        { status: 500 },
      );
    }

    // 3. Add participants
    const participantsData = [
      { conversation_id: newConv.id, profile_id: user.id },
      { conversation_id: newConv.id, profile_id: participantId },
    ];

    const { error: partError } = await adminSupabase
      .from("conversation_participants")
      .insert(participantsData);

    if (partError) {
      await adminSupabase.from("conversations").delete().eq("id", newConv.id);
      return NextResponse.json(
        { success: false, error: partError.message },
        { status: 500 },
      );
    }

    // 4. Fetch the newly created conversation with participants
    const { data: createdConv, error: finalError } = await adminSupabase
      .from("conversations")
      .select(
        `
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
      `,
      )
      .eq("id", newConv.id)
      .single();

    if (finalError || !createdConv) {
      return NextResponse.json(
        {
          success: false,
          error: finalError?.message || "Failed to retrieve new conversation",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      conversation: createdConv,
      existing: false,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return handleApiError(message);
  }
}
