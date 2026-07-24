"use client";

import { Profile } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, MessageSquare, ShieldBan, Check } from "lucide-react";
import { useState, useEffect } from "react";
import {
  sendFriendRequest,
  getFriendStatus,
  startConversationWithUser,
  blockUser,
  unblockUser,
} from "../actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { useChatStore } from "@/features/messaging/store/use-chat-store";

export function ProfileView({
  profile,
  currentUserId,
}: {
  profile: Profile & {
    status_message?: string | null;
    degree_program?: string | null;
    year_level?: string | null;
    academic_year_joined?: string | null;
    committee?: string | null;
  };
  currentUserId: string;
}) {
  const router = useRouter();
  const { openChat } = useChatStore();
  const [friendStatus, setFriendStatus] = useState<
    "none" | "pending" | "accepted" | "blocked"
  >("none");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await getFriendStatus(profile.id);
        if (res.success && res.status) {
          setFriendStatus(res.status);
        }
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, [profile.id]);

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2) || "U";
  };

  const handleAddFriend = async () => {
    setLoading(true);
    try {
      const res = await sendFriendRequest(profile.id);
      if (res.success) {
        setFriendStatus("pending");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = async () => {
    setLoading(true);
    try {
      const res = await startConversationWithUser(profile.id);
      if (res.success && res.conversationId) {
        openChat(res.conversationId);
      } else {
        toast.error("Failed to start conversation");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async () => {
    setLoading(true);
    try {
      const res = await blockUser(profile.id);
      if (res.success) {
        setFriendStatus("blocked");
        toast.success("User blocked");
      } else {
        toast.error(res.error || "Failed to block user");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async () => {
    setLoading(true);
    try {
      const res = await unblockUser(profile.id);
      if (res.success) {
        setFriendStatus("none");
        toast.success("User unblocked");
      } else {
        toast.error(res.error || "Failed to unblock user");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-primary/10 shadow-md">
        <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent"></div>
        <CardContent className="relative pt-0 pb-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 -mt-16 sm:-mt-20">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
              <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                <AvatarImage
                  src={
                    profile.avatar_url?.startsWith("avatars/")
                      ? `/api/v1/avatar?pathname=${encodeURIComponent(profile.avatar_url)}`
                      : profile.avatar_url || ""
                  }
                />
                <AvatarFallback className="text-4xl">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left pb-2 space-y-1">
                <h1 className="text-3xl font-bold">
                  {profile.full_name || "Unknown User"}
                </h1>
                <p className="text-muted-foreground font-medium">
                  {profile.membership_classification === "learner"
                    ? "Learner"
                    : profile.membership_classification === "esas_scholar"
                      ? "ESAS Scholar"
                      : "Regular Member"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap justify-center md:justify-end gap-2 pb-2">
              {friendStatus === "blocked" ? (
                <Button
                  onClick={handleUnblock}
                  variant="destructive"
                  disabled={loading}
                >
                  <ShieldBan className="h-4 w-4 mr-2" /> Unblock
                </Button>
              ) : (
                <>
                  {friendStatus === "none" && (
                    <Button onClick={handleAddFriend} disabled={loading}>
                      <UserPlus className="h-4 w-4 mr-2" /> Add Friend
                    </Button>
                  )}
                  {friendStatus === "pending" && (
                    <Button variant="secondary" disabled>
                      <Check className="h-4 w-4 mr-2" /> Request Sent
                    </Button>
                  )}
                  {friendStatus === "accepted" && (
                    <Button variant="secondary" disabled>
                      <Check className="h-4 w-4 mr-2" /> Friends
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={handleMessage}
                    disabled={loading}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" /> Message
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" disabled={loading}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={handleBlock}
                        className="text-destructive"
                      >
                        <ShieldBan className="h-4 w-4 mr-2" /> Block User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          </div>

          {profile.status_message && (
            <div className="mt-8 p-4 bg-muted/50 rounded-lg border-l-4 border-primary">
              <p className="italic text-foreground/80">
                &quot;{profile.status_message}&quot;
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="text-xl">About</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.bio ? (
              <p className="text-muted-foreground whitespace-pre-wrap">
                {profile.bio}
              </p>
            ) : (
              <p className="text-muted-foreground italic">No bio provided.</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border/50">
              {profile.degree_program && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Degree Program
                  </p>
                  <p className="font-medium">{profile.degree_program}</p>
                </div>
              )}
              {profile.year_level && (
                <div>
                  <p className="text-sm text-muted-foreground">Year Level</p>
                  <p className="font-medium">{profile.year_level}</p>
                </div>
              )}
              {profile.academic_year_joined && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Academic Year Joined
                  </p>
                  <p className="font-medium">{profile.academic_year_joined}</p>
                </div>
              )}
              {profile.committee && (
                <div>
                  <p className="text-sm text-muted-foreground">Committee</p>
                  <p className="font-medium capitalize">
                    {profile.committee.replace(/_/g, " ")}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60 h-fit">
          <CardHeader>
            <CardTitle className="text-xl">Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-border/50">
              <span className="text-muted-foreground">Level</span>
              <span className="font-bold text-primary">
                {profile.current_level || 1}
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-border/50">
              <span className="text-muted-foreground">Total XP</span>
              <span className="font-bold">
                {profile.total_xp?.toLocaleString() || 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
