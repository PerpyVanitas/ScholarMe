import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ChatInterface } from "@/features/messaging/components/chat-interface";
import type { Conversation } from "@/lib/types";
import { UserSelector } from "./components/user-selector";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";

export const metadata = {
  title: "User Messages Audit | ScholarMe",
  description: "Audit message history of other users.",
};

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AdminMessagesAuditPage({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  const userId =
    typeof resolvedParams.userId === "string"
      ? resolvedParams.userId
      : undefined;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch the logged-in user's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, roles(name)")
    .eq("id", user.id)
    .single();

  const rawRole = profile?.roles;
  const roleName = Array.isArray(rawRole)
    ? rawRole[0]?.name
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    : (rawRole as any)?.name;

  if (roleName !== "super_admin") {
    redirect("/dashboard/home");
  }

  let formattedConversations: Conversation[] = [];

  if (userId) {
    // 1. Fetch conversations this user is a part of
    const { data: participantData } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("profile_id", userId);

    const conversationIds =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      participantData?.map((p: any) => p.conversation_id) || [];

    if (conversationIds.length > 0) {
      // 2. Fetch full conversations
      const { data: conversations, error } = await supabase
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
        console.error("Error fetching admin conversations:", error);
        toast.error(
          error instanceof Error ? error.message : "An error occurred",
        );
      }

      // Format the conversations data to pass to the Client Component
      formattedConversations = (conversations || []).map((conv) => {
        // Sort messages to get the latest one
        const sortedMessages = conv.messages?.sort(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );

        return {
          ...conv,
          messages: sortedMessages,
        };
      }) as Conversation[];
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-start sm:items-center justify-between mb-4 flex-col sm:flex-row gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            User Messages Audit
          </h1>
          <p className="text-muted-foreground">
            Audit system-wide message history for a specific user.
          </p>
        </div>
        <div className="w-full sm:w-auto z-10">
          <UserSelector />
        </div>
      </div>

      {/* Super admin view of conversations */}
      <div className="flex-1 bg-card rounded-lg border shadow-sm overflow-hidden min-h-[500px]">
        {!userId ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
            <ShieldAlert className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-lg font-medium text-foreground">
              No User Selected
            </p>
            <p>
              Use the selector above to find a user and audit their
              conversations.
            </p>
          </div>
        ) : formattedConversations.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
            <ShieldAlert className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-lg font-medium text-foreground">
              No Conversations Found
            </p>
            <p>This user has not participated in any conversations yet.</p>
          </div>
        ) : (
          <ChatInterface
            key={userId}
            initialConversations={formattedConversations}
            currentUserId={userId}
            isAdmin={true}
            forceAuditMode={true}
          />
        )}
      </div>
    </div>
  );
}
