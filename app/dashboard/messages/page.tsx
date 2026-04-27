import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
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

  // Messaging tables (conversations, conversation_participants, messages) are not
  // yet created in Supabase. Show a placeholder until the schema migration is run.
  const messagingEnabled = false; // Flip to true after running messaging SQL migration

  let formattedConversations: Conversation[] = [];

  if (messagingEnabled) {
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
      `
      )
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching conversations:", error);
    }

    formattedConversations = (conversations || []).map((conv) => {
      const sortedMessages = conv.messages?.sort(
        (a: { created_at: string }, b: { created_at: string }) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      return { ...conv, messages: sortedMessages };
    }) as Conversation[];
  }

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

      {messagingEnabled ? (
        // Dynamically imported to avoid import errors before tables exist
        <div className="flex-1 bg-card rounded-lg border shadow-sm overflow-hidden min-h-[500px]">
          {/* ChatInterface will be re-enabled once messaging schema is in Supabase */}
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Chat interface loading…
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-muted/30 text-center p-8">
          <div className="rounded-full bg-primary/10 p-4">
            <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-foreground">Messaging coming soon</p>
            <p className="text-sm text-muted-foreground mt-1">
              The messaging database tables are being set up. Check back shortly.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
