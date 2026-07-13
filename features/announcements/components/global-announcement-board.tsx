"use client";

import { useEffect, useState } from "react";
import { Announcement } from "@/lib/types";
import {
  getAnnouncements,
  deleteAnnouncement,
  createAnnouncement,
} from "../api/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Megaphone, Trash2, Plus, AlertCircle } from "lucide-react";
import { useUser } from "@/lib/user-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export function GlobalAnnouncementBoard() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const { role } = useUser();
  const isAdmin = role === "administrator" || role === "super_admin";
  const [open, setOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      const data = await getAnnouncements();
      setAnnouncements(data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteAnnouncement(id);
      toast.success("Announcement deleted");
      fetchAnnouncements();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    setSubmitting(true);
    try {
      await createAnnouncement({ title, content, priority });
      toast.success("Announcement posted!");
      setOpen(false);
      setTitle("");
      setContent("");
      setPriority(false);
      fetchAnnouncements();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null; // Or a skeleton
  if (announcements.length === 0 && !isAdmin) return null;

  return (
    <div className="mb-6 space-y-4">
      {isAdmin && (
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-primary" />
            Announcements
          </h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                New Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Post Global Announcement</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Input
                    placeholder="Announcement Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Textarea
                    placeholder="Announcement content (Markdown supported)"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    rows={8}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="priority"
                    checked={priority}
                    onCheckedChange={(c) => setPriority(!!c)}
                  />
                  <label
                    htmlFor="priority"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1"
                  >
                    Mark as Urgent{" "}
                    <AlertCircle className="w-4 h-4 text-destructive" />
                  </label>
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Posting..." : "Post Announcement"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {announcements.map((announcement) => (
        <Card
          key={announcement.id}
          className={`overflow-hidden border-l-4 ${
            announcement.priority ? "border-l-destructive" : "border-l-primary"
          }`}
        >
          <CardContent className="p-4 sm:p-6">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {announcement.priority && (
                    <Badge
                      variant="destructive"
                      className="flex items-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3" />
                      Urgent
                    </Badge>
                  )}
                  <h3 className="text-xl font-bold">{announcement.title}</h3>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                  <ReactMarkdown>{announcement.content}</ReactMarkdown>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                  <span className="font-medium text-foreground">
                    {announcement.profiles?.full_name || "Admin"}
                  </span>
                  <span>•</span>
                  <span>
                    {formatDistanceToNow(new Date(announcement.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => handleDelete(announcement.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
