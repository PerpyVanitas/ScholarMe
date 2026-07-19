import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ChatInterface } from "@/features/messaging/components/chat-interface";
import { ErrorBoundary } from "@/components/error-boundary";
import { toast } from "sonner";
import type { Conversation } from "@/lib/types";

export const metadata = {
  title: "Messages | ScholarMe",
  description: "Chat with your tutors and learners.",
};

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ conversationId?: string }>;
}) {
  const resolvedParams = await searchParams;
  const defaultConversationId = resolvedParams.conversationId;
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isAdmin = (profile as any)?.roles?.name === "administrator";

  // First, get list of conversation IDs the user is a participant in
  const { data: participants } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("profile_id", user.id);

  const conversationIds = (participants || []).map((p) => p.conversation_id);

  // Fetch full details only for conversations the user belongs to
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let conversations: unknown[] = [];
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
      `,
      )
      .in("id", conversationIds)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching conversations:", error);
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } else {
      conversations = data || [];
    }
  }

  // Format the conversations data to pass to the Client Component
  const formattedConversations = conversations.map((conv) => {
    // Sort messages to get the latest one
    // @ts-ignore: Strict unknown type check
    const sortedMessages = conv.messages?.sort(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (a: unknown, b: unknown) =>
        // @ts-ignore: Strict unknown type check
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    return {
      // @ts-ignore: Strict unknown type check
      ...conv,
      messages: sortedMessages,
    };
  }) as Conversation[];

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] -m-4 md:-m-6 pb-20 md:pb-0 overflow-hidden bg-background">
      <ErrorBoundary>
        <ChatInterface
          initialConversations={formattedConversations}
          currentUserId={user.id}
          isAdmin={isAdmin}
          defaultActiveConversationId={defaultConversationId}
        />
      </ErrorBoundary>
    </div>
  );
}
