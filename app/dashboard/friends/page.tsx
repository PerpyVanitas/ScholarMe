import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Check, X, MessageSquare, UserMinus } from "lucide-react";
import { revalidatePath } from "next/cache";

export const metadata: Metadata = {
  title: "Friends | ScholarMe",
  description: "Manage your friends and friend requests.",
};

export default async function FriendsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: pendingRequests } = await supabase
    .from("friends")
    .select(
      `
      id,
      user_id1,
      user_id2,
      profiles!friends_user_id1_fkey (id, full_name, avatar_url, membership_classification)
    `,
    )
    .eq("user_id2", user.id)
    .eq("status", "pending");

  const { data: friends1 } = await supabase
    .from("friends")
    .select(
      `
      id,
      user_id2,
      profiles!friends_user_id2_fkey (id, full_name, avatar_url, membership_classification)
    `,
    )
    .eq("user_id1", user.id)
    .eq("status", "accepted");

  const { data: friends2 } = await supabase
    .from("friends")
    .select(
      `
      id,
      user_id1,
      profiles!friends_user_id1_fkey (id, full_name, avatar_url, membership_classification)
    `,
    )
    .eq("user_id2", user.id)
    .eq("status", "accepted");

  const { data: blockedFriends } = await supabase
    .from("friends")
    .select(
      `
      id,
      user_id2,
      profiles!friends_user_id2_fkey (id, full_name, avatar_url, membership_classification)
    `,
    )
    .eq("user_id1", user.id)
    .eq("status", "blocked");

  const acceptedFriends = [
    ...(friends1 || []).map((f: any) => ({ ...f.profiles, friend_id: f.id })),
    ...(friends2 || []).map((f: any) => ({ ...f.profiles, friend_id: f.id })),
  ];

  const blockedUsers = (blockedFriends || []).map((f: any) => ({
    ...f.profiles,
    friend_id: f.id,
  }));

  const getInitials = (name: string) => {
    return (
      name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2) || "U"
    );
  };

  const handleAccept = async (formData: FormData) => {
    "use server";
    const requestId = formData.get("requestId") as string;
    const supabase = await createClient();
    await supabase
      .from("friends")
      .update({ status: "accepted" })
      .eq("id", requestId);
    revalidatePath("/dashboard/friends");
  };

  const handleDecline = async (formData: FormData) => {
    "use server";
    const requestId = formData.get("requestId") as string;
    const supabase = await createClient();
    await supabase.from("friends").delete().eq("id", requestId);
    revalidatePath("/dashboard/friends");
  };

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-8 w-full max-w-4xl mx-auto min-h-[calc(100vh-3.5rem)]">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Friends</h1>
        <p className="text-muted-foreground mt-1">Manage your connections.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center justify-between">
            Friend Requests
            {pendingRequests && pendingRequests.length > 0 && (
              <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                {pendingRequests.length}
              </span>
            )}
          </h2>

          {pendingRequests && pendingRequests.length > 0 ? (
            <div className="space-y-3">
              {pendingRequests.map((req: any) => (
                <Card key={req.id}>
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={req.profiles?.avatar_url || ""} />
                        <AvatarFallback>
                          {getInitials(req.profiles?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{req.profiles?.full_name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {req.profiles?.membership_classification?.replace(
                            /_/g,
                            " ",
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <form action={handleAccept}>
                        <input type="hidden" name="requestId" value={req.id} />
                        <Button
                          size="icon"
                          variant="default"
                          className="h-8 w-8 rounded-full"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </form>
                      <form action={handleDecline}>
                        <input type="hidden" name="requestId" value={req.id} />
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 rounded-full text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground border rounded-lg p-8 text-center bg-card">
              No pending friend requests.
            </p>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center justify-between">
            My Friends
            <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full">
              {acceptedFriends.length}
            </span>
          </h2>

          {acceptedFriends.length > 0 ? (
            <div className="space-y-3">
              {acceptedFriends.map((friend: any) => (
                <Card key={friend.id}>
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={friend.avatar_url || ""} />
                        <AvatarFallback>
                          {getInitials(friend.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{friend.full_name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {friend.membership_classification?.replace(/_/g, " ")}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <a href={`/dashboard/messages?userId=${friend.id}`}>
                          <MessageSquare className="h-4 w-4 mr-2" /> Message
                        </a>
                      </Button>
                      <form action={handleDecline}>
                        <input
                          type="hidden"
                          name="requestId"
                          value={friend.friend_id}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          title="Unfriend"
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground border rounded-lg p-8 text-center bg-card">
              You haven't added any friends yet. Check out the Users Directory
              to connect with others!
            </p>
          )}

          {blockedUsers.length > 0 && (
            <div className="mt-8 space-y-4">
              <h2 className="text-xl font-semibold flex items-center justify-between text-muted-foreground">
                Blocked Users
                <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full">
                  {blockedUsers.length}
                </span>
              </h2>

              <div className="space-y-3">
                {blockedUsers.map((blockedUser: any) => (
                  <Card key={blockedUser.id} className="opacity-70 grayscale">
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={blockedUser.avatar_url || ""} />
                          <AvatarFallback>
                            {getInitials(blockedUser.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{blockedUser.full_name}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <form action={handleDecline}>
                          <input
                            type="hidden"
                            name="requestId"
                            value={blockedUser.friend_id}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            Unblock
                          </Button>
                        </form>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
