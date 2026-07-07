"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { ForumPost } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreatePostDialog } from "./components/create-post-dialog";

export default function ForumsPage() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const supabase = createClient();

  async function fetchPosts() {
    setLoading(true);
    const { data } = await supabase
      .from("forum_posts")
      .select(
        `
          *,
          profiles:author_id(full_name, avatar_url)
        `,
      )
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (data) setPosts(data as ForumPost[]);
    setLoading(false);
  }

  useEffect(() => {
    fetchPosts();
  }, [supabase]);

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full p-4 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-primary" />
            Organization Forums
          </h1>
          <p className="text-muted-foreground mt-1">
            Discuss topics, share study guides, and connect with peers.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>New Discussion</Button>
      </div>

      <div className="flex flex-col gap-4">
        {loading ? (
          <p className="text-muted-foreground">Loading discussions...</p>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-lg font-medium">No discussions yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Be the first to start a conversation!
              </p>
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => setCreateOpen(true)}
              >
                Start Discussion
              </Button>
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            <Link key={post.id} href={`/dashboard/forums/${post.id}`}>
              <Card
                className={`hover:border-primary/50 transition-colors cursor-pointer ${post.is_pinned ? "border-primary/30 bg-primary/5" : ""}`}
              >
                <CardHeader className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle className="text-xl flex items-center gap-2">
                        {post.is_pinned && (
                          <Pin className="h-4 w-4 text-primary fill-primary" />
                        )}
                        {post.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="secondary" className="font-normal">
                          {post.category}
                        </Badge>
                        <span>•</span>
                        <span>
                          Posted by {post.profiles?.full_name || "Unknown"}
                        </span>
                        <span>•</span>
                        <span>
                          {formatDistanceToNow(new Date(post.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="py-2 pb-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {post.content}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>

      <CreatePostDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={fetchPosts}
      />
    </div>
  );
}
