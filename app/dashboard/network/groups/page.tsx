"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { CreateGroupDialog } from "./components/create-group-dialog";

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  is_public: boolean;
  member_count: number;
}

export default function StudyGroupsPage() {
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [myGroupIds, setMyGroupIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  async function loadGroups() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Load public groups and their member counts
    const { data, error } = await supabase
      .from("study_groups")
      .select(
        `
        id,
        name,
        description,
        is_public,
        study_group_members(count)
      `,
      )
      .order("created_at", { ascending: false });

    // Load my memberships
    const { data: memberships } = await supabase
      .from("study_group_members")
      .select("group_id")
      .eq("user_id", user.id);

    if (error) {
      console.error("Failed to load study groups error:", error);
      toast.error("Failed to load study groups");
    } else {
       
      const formatted = (data as unknown[]).map((g) => ({
        // @ts-expect-error: Strict unknown type check
        ...g,
        // @ts-expect-error: Strict unknown type check
        member_count: g.study_group_members?.[0]?.count || 0,
      }));
      setGroups(formatted);
    }

    if (memberships) {
      setMyGroupIds(new Set(memberships.map((m) => m.group_id)));
    }
    setLoading(false);
  }

  async function handleJoin(groupId: string) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("study_group_members").insert({
      group_id: groupId,
      user_id: user.id,
    });

    if (error) {
      toast.error("Failed to join group");
    } else {
      toast.success("Joined group!");
      setMyGroupIds((prev) => {
        const next = new Set(prev);
        next.add(groupId);
        return next;
      });
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId ? { ...g, member_count: g.member_count + 1 } : g,
        ),
      );
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Study Groups</h1>
          <p className="text-muted-foreground">
            Find or create groups to study with peers.
          </p>
        </div>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Study Groups</h1>
          <p className="text-muted-foreground">
            Find or create groups to study with peers.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Group
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => {
          const isMember = myGroupIds.has(group.id);
          return (
            <Card key={group.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg break-words overflow-hidden break-all">{group.name}</CardTitle>
                  <Badge variant={group.is_public ? "secondary" : "outline"}>
                    {group.is_public ? "Public" : "Private"}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2 break-words break-all">
                  {group.description || "No description provided."}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="mr-1.5 h-4 w-4" />
                  {group.member_count} member
                  {group.member_count === 1 ? "" : "s"}
                </div>
              </CardContent>
              <CardFooter>
                {isMember ? (
                  <Button variant="secondary" className="w-full" asChild>
                    <Link href={`/dashboard/groups/${group.id}`}>
                      View Group
                    </Link>
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => handleJoin(group.id)}
                  >
                    Join Group
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
        {groups.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No public study groups found. Be the first to create one!
          </div>
        )}
      </div>

      <CreateGroupDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={loadGroups}
      />
    </div>
  );
}
