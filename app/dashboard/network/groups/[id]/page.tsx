"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Loader2, MessageSquare, Users } from "lucide-react";
import { getAvatarUrl } from "@/lib/utils";
import { StudyGroupChat } from "@/features/study-groups/components/study-group-chat";

interface GroupMember {
  user_id: string;
  role: string;
  profiles: { full_name: string; avatar_url: string | null } | null;
}

export default function StudyGroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [group, setGroup] = useState<{
    id: string;
    name: string;
    description: string | null;
    is_public: boolean;
  } | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      const { data: groupData } = await supabase
        .from("study_groups")
        .select("id, name, description, is_public")
        .eq("id", id)
        .single();

      const { data: memberData } = await supabase
        .from("study_group_members")
        .select("user_id, role, profiles:user_id(full_name, avatar_url)")
        .eq("group_id", id);

      if (groupData) setGroup(groupData);
      if (memberData) {
         
        const normalized = (memberData as unknown[]).map((m) => ({
          // @ts-expect-error: required
          ...m,
          // @ts-expect-error: required
          profiles: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles,
        })) as GroupMember[];
        setMembers(normalized);
        setIsMember(
          !!user && normalized.some((m: GroupMember) => m.user_id === user.id),
        );
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Group not found.{" "}
        <Link href="/dashboard/groups" className="text-primary underline">
          Back to groups
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto p-4 sm:p-6">
      <Button variant="ghost" className="w-fit" asChild>
        <Link href="/dashboard/groups">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Groups
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">{group.name}</CardTitle>
              <CardDescription className="mt-1">
                {group.description || "No description provided."}
              </CardDescription>
            </div>
            <Badge variant={group.is_public ? "secondary" : "outline"}>
              {group.is_public ? "Public" : "Private"}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {isMember && currentUserId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Group Chat
            </CardTitle>
            <CardDescription>
              Real-time chat with your study group members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StudyGroupChat groupId={id} currentUserId={currentUserId} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members & Internal Roles ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {members.map((member) => {
            const memberRole = member.role || "member";
            const isGroupAdmin = members.find((m) => m.user_id === currentUserId)?.role === "admin";

            return (
              <div
                key={member.user_id}
                className="flex items-center justify-between rounded-lg border p-3 flex-wrap gap-2"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={getAvatarUrl(member.profiles?.avatar_url)}
                    />
                    <AvatarFallback>
                      {member.profiles?.full_name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        {member.profiles?.full_name || "Unknown"}
                      </p>
                      <Badge
                        className={
                          memberRole === "admin"
                            ? "bg-purple-600 text-white text-[10px]"
                            : memberRole === "moderator"
                              ? "bg-blue-600 text-white text-[10px]"
                              : "bg-muted text-muted-foreground text-[10px]"
                        }
                      >
                        {memberRole.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isGroupAdmin && member.user_id !== currentUserId && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => {
                        const newRole = memberRole === "member" ? "moderator" : memberRole === "moderator" ? "admin" : "member";
                        setMembers((prev) =>
                          prev.map((m) => (m.user_id === member.user_id ? { ...m, role: newRole } : m)),
                        );
                      }}
                    >
                      Cycle Role
                    </Button>
                  )}
                  {member.user_id !== currentUserId && (
                    <Button size="sm" variant="outline" asChild className="h-7 text-xs">
                      <Link href={`/dashboard/messages?user=${member.user_id}`}>
                        <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                        Message
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
