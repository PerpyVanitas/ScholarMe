import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ChatInterface } from "@/features/messaging/components/chat-interface";
import type { Conversation } from "@/lib/types";

export const metadata = {
  title: "Messages | ScholarMe",
  description: "Chat with your tutors and learners.",
};

export default async function MessagesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch the logged-in user's profile with their role
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, roles(name)")
    .eq("id", user.id)
    .single();

  const isAdmin = (profile as any)?.roles?.name === "administrator";

  // First, get list of conversation IDs the user is a participant in
  const { data: participants } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("profile_id", user.id);

  const conversationIds = (participants || []).map((p) => p.conversation_id);

  // Fetch full details only for conversations the user belongs to
  let conversations: any[] = [];
  if (conversationIds.length > 0) {
    const { data, error } = await supabase
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
      `
      )
      .in("id", conversationIds)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching conversations:", error);
    } else {
      conversations = data || [];
    }
  }

  // Format the conversations data to pass to the Client Component
  const formattedConversations = conversations.map((conv) => {
    // Sort messages to get the latest one
    const sortedMessages = conv.messages?.sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return {
      ...conv,
      messages: sortedMessages,
    };
  }) as Conversation[];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
          <p className="text-muted-foreground">
            Connect directly with your peers and tutors.
          </p>
        </div>
      </div>
      
      {/* Standard direct chat interface for own messages */}
      <div className="flex-1 bg-card rounded-lg border shadow-sm overflow-hidden min-h-[500px]">
        <ChatInterface 
          initialConversations={formattedConversations} 
          currentUserId={user.id} 
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
}
