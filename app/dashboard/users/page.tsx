import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { UsersDirectory } from "./components/users-directory";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Users Directory | ScholarMe",
  description: "Find and connect with other users in the community.",
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Await search params before using them as required by Next.js 15
  const params = await searchParams;
  const initialQuery = params.query || "";

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 w-full max-w-6xl mx-auto min-h-[calc(100vh-3.5rem)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users Directory</h1>
          <p className="text-muted-foreground mt-1">
            Connect with other learners, find study buddies, and message
            friends.
          </p>
        </div>
      </div>
      <UsersDirectory currentUserId={user.id} initialQuery={initialQuery} />
    </div>
  );
}
