"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { ForumPost, ForumReply } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Loader2, MessageSquare, Pin, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { createForumReply } from "@/features/forums/api/actions";
import { ReportDialog } from "../components/report-dialog";

export default function ForumPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: postId } = use(params);
  const [post, setPost] = useState<ForumPost | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [bestAnswerId, setBestAnswerId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const supabase = createClient();

  async function loadPost() {
    const { data: postData } = await supabase
      .from("forum_posts")
      .select(`*, profiles:author_id(full_name, avatar_url)`)
      .eq("id", postId)
      .single();

    const { data: replyData } = await supabase
      .from("forum_replies")
      .select(`*, profiles:author_id(full_name, avatar_url)`)
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (postData) setPost(postData as ForumPost);
    if (replyData) setReplies(replyData as ForumReply[]);
    setLoading(false);
  }

  useEffect(() => {
    loadPost();
  }, [postId]);

  async function handleReply() {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await createForumReply(postId, replyText);
      setReplyText("");
      toast.success("Reply posted");
      await loadPost();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to reply");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Discussion not found.{" "}
        <Link href="/dashboard/forums" className="text-primary underline">
          Back to forums
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" className="w-fit" asChild>
          <Link href="/dashboard/forums">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Forums
          </Link>
        </Button>
      </div>

      <Card className={post.is_pinned ? "border-primary/30 bg-primary/5" : ""}>
        <CardHeader>
          <div className="flex justify-between items-start gap-4">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2 break-words overflow-hidden break-all">
                {post.is_pinned && (
                  <Pin className="h-5 w-5 text-primary fill-primary" />
                )}
                {post.title}
              </CardTitle>
              <CardDescription className="flex flex-wrap items-center gap-2 mt-1.5">
                <Badge variant="secondary">{post.category}</Badge>
                <span>Posted by {post.profiles?.full_name || "Unknown"}</span>
                <span>•</span>
                <span>
                  {formatDistanceToNow(new Date(post.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => setReportOpen(true)}
            >
              Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm leading-relaxed break-words break-all">
            {post.content}
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Replies ({replies.length})
        </h2>
        {replies.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No replies yet. Be the first to respond.
          </p>
        ) : (
          [...replies]
            .sort((a, b) => (a.id === bestAnswerId ? -1 : b.id === bestAnswerId ? 1 : 0))
            .map((reply) => {
              const isBest = reply.id === bestAnswerId;
              return (
                <Card
                  key={reply.id}
                  className={isBest ? "border-emerald-500/50 bg-emerald-500/5 ring-1 ring-emerald-500/30" : ""}
                >
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {reply.profiles?.full_name || "Unknown"}
                        </span>
                        <span>•</span>
                        <span>
                          {formatDistanceToNow(new Date(reply.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                        {isBest && (
                          <Badge className="bg-emerald-600 text-white flex items-center gap-1 text-[10px]">
                            <CheckCircle2 className="h-3 w-3" /> Best Answer
                          </Badge>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant={isBest ? "secondary" : "ghost"}
                        className="h-7 text-xs gap-1"
                        onClick={() => {
                          const newId = isBest ? null : reply.id;
                          setBestAnswerId(newId);
                          toast.success(
                            newId ? "Marked as Best Answer" : "Unmarked Best Answer",
                          );
                        }}
                      >
                        <CheckCircle2 className={`h-3.5 w-3.5 ${isBest ? "text-emerald-600 font-bold" : ""}`} />
                        {isBest ? "Accepted" : "Mark Best Answer"}
                      </Button>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{reply.content}</p>
                  </CardContent>
                </Card>
              );
            })
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add a Reply</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write your reply..."
            rows={4}
          />
          <Button
            onClick={handleReply}
            disabled={submitting || !replyText.trim()}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Post Reply
          </Button>
        </CardContent>
      </Card>

      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        postId={postId}
      />
    </div>
  );
}
