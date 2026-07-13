"use server";

import { createClient } from "@/lib/supabase/server";

export async function getFriendStatus(targetUserId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("friends")
    .select("status, user_id1, user_id2")
    .or(
      `and(user_id1.eq.${user.id},user_id2.eq.${targetUserId}),and(user_id1.eq.${targetUserId},user_id2.eq.${user.id})`,
    )
    .maybeSingle();

  if (error) {
    console.error("Error fetching friend status:", error);
    return { success: false, error: error.message };
  }

  if (!data) {
    return { success: true, status: "none" };
  }

  return { success: true, status: data.status };
}

export async function sendFriendRequest(targetUserId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Ensure they are not already friends or pending
  const statusRes = await getFriendStatus(targetUserId);
  if (statusRes.success && statusRes.status !== "none") {
    return { success: false, error: "Friend request already exists" };
  }

  const { error } = await supabase.from("friends").insert({
    user_id1: user.id,
    user_id2: targetUserId,
    status: "pending",
  });

  if (error) {
    console.error("Error sending friend request:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function startConversationWithUser(targetUserId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Check if a conversation already exists between these two users
  const { data: existingConversations, error: fetchError } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("profile_id", user.id);

  if (
    !fetchError &&
    existingConversations &&
    existingConversations.length > 0
  ) {
    const conversationIds = existingConversations.map((c) => c.conversation_id);

    const { data: targetParticipation } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("profile_id", targetUserId)
      .in("conversation_id", conversationIds);

    if (targetParticipation && targetParticipation.length > 0) {
      // Return the first one found
      return {
        success: true,
        conversationId: targetParticipation[0].conversation_id,
      };
    }
  }

  // Create new conversation
  const { data: newConv, error: createConvError } = await supabase
    .from("conversations")
    .insert({})
    .select("id")
    .single();

  if (createConvError || !newConv) {
    return {
      success: false,
      error: createConvError?.message || "Failed to create conversation",
    };
  }

  // Add participants
  const { error: partError } = await supabase
    .from("conversation_participants")
    .insert([
      { conversation_id: newConv.id, profile_id: user.id },
      { conversation_id: newConv.id, profile_id: targetUserId },
    ]);

  if (partError) {
    return { success: false, error: partError.message };
  }

  return { success: true, conversationId: newConv.id };
}

export async function blockUser(targetUserId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Check if there is an existing friendship
  const { data: existingFriend } = await supabase
    .from("friends")
    .select("id")
    .or(
      `and(user_id1.eq.${user.id},user_id2.eq.${targetUserId}),and(user_id1.eq.${targetUserId},user_id2.eq.${user.id})`,
    )
    .maybeSingle();

  if (existingFriend) {
    // Update existing to blocked
    const { error } = await supabase
      .from("friends")
      .update({ status: "blocked", user_id1: user.id, user_id2: targetUserId }) // Ensure user_id1 is the blocker
      .eq("id", existingFriend.id);
    if (error) return { success: false, error: error.message };
  } else {
    // Insert new blocked status
    const { error } = await supabase.from("friends").insert({
      user_id1: user.id,
      user_id2: targetUserId,
      status: "blocked",
    });
    if (error) return { success: false, error: error.message };
  }

  return { success: true };
}

export async function unblockUser(targetUserId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("friends")
    .delete()
    .eq("user_id1", user.id)
    .eq("user_id2", targetUserId)
    .eq("status", "blocked");

  if (error) return { success: false, error: error.message };

  return { success: true };
}
