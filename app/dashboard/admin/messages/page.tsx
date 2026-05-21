import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ChatInterface } from "@/features/messaging/components/chat-interface";
import type { Conversation } from "@/lib/types";

export const metadata = {
  title: "User Messages Audit | ScholarMe",
  description: "Audit message history of other users.",
};

export default async function AdminMessagesAuditPage() {
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

  const isSuperAdmin = profile?.email === "admin@scholarme.com" || profile?.email === "admin@scholarme.org";

  // Highest tier of control: Only visible to super admin email
  if (!isSuperAdmin) {
    redirect("/dashboard/home");
  }

  // Fetch all conversations. Since the user is a super admin, RLS allows retrieving all conversations.
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
    console.error("Error fetching admin conversations:", error);
  }

  // Format the conversations data to pass to the Client Component
  const formattedConversations = (conversations || []).map((conv) => {
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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">User Messages Audit</h1>
          <p className="text-muted-foreground">
            Audit system-wide message history between all tutors and learners.
          </p>
        </div>
      </div>
      
      {/* Super admin view of all conversations */}
      <div className="flex-1 bg-card rounded-lg border shadow-sm overflow-hidden min-h-[500px]">
        <ChatInterface 
          initialConversations={formattedConversations} 
          currentUserId={user.id} 
          isAdmin={true}
        />
      </div>
    </div>
  );
}
