import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ProfileView } from "./components/profile-view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "User Profile | ScholarMe",
  description: "View user profile on ScholarMe",
};

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const targetUserId = resolvedParams.id;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // If viewing own profile, redirect to main profile page
  if (user.id === targetUserId) {
    redirect("/dashboard/profile");
  }

  // Fetch the target user's profile
  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      `
      *,
      roles (name)
    `,
    )
    .eq("id", targetUserId)
    .single();

  if (error || !profile) {
    return notFound();
  }

  // Check privacy
  const isTutor =
    profile.roles?.name === "tutor" ||
    profile.roles?.name === "super_admin" ||
    profile.roles?.name === "administrator";
  if (profile.is_private && !isTutor) {
    // If it's private and they aren't a tutor/admin, we might block access or show a limited view.
    // For now, let's just show a restricted view or a "This profile is private" message.
    return (
      <div className="flex-1 p-6 flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Private Profile</h2>
          <p className="text-muted-foreground">
            This user has chosen to keep their profile private.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 w-full max-w-4xl mx-auto min-h-[calc(100vh-3.5rem)]">
      <ProfileView profile={profile} currentUserId={user.id} />
    </div>
  );
}
