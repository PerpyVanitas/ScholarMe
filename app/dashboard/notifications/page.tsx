/** Notifications page -- view, mark-read, mark-all-read, filter by type, and delete all. */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Calendar,
  BookOpen,
  Settings,
  CheckCheck,
  Loader2,
  MessageSquare,
  Trash2,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import type { Notification } from "@/lib/types";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const typeIcons: Record<string, React.ReactNode> = {
  session: <Calendar className="h-4 w-4" />,
  resource: <BookOpen className="h-4 w-4" />,
  system: <Settings className="h-4 w-4" />,
  message: <MessageSquare className="h-4 w-4" />,
};

const typeColors: Record<string, string> = {
  session: "bg-primary/10 text-primary",
  resource: "bg-accent/30 text-accent-foreground",
  system: "bg-muted text-muted-foreground",
  message: "bg-amber-500/10 text-amber-500",
};

const TYPE_LABELS: Record<string, string> = {
  all: "All",
  session: "Sessions",
  message: "Messages",
  resource: "Resources",
  system: "System",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [unreadOnly, setUnreadOnly] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      setNotifications(data || []);
      setLoading(false);
    }
    load();
  }, []);

  async function markAsRead(id: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
    }
  }

  async function markAllRead() {
    const supabase = createClient();
    const unread = notifications.filter((n) => !n.is_read);
    if (unread.length === 0) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .in(
        "id",
        unread.map((n) => n.id),
      );

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success("All notifications marked as read");
    }
  }

  async function clearAll() {
    setClearing(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setClearing(false);
      return;
    }

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", user.id);

    if (!error) {
      setNotifications([]);
      toast.success("All notifications cleared");
    } else {
      toast.error("Failed to clear notifications");
    }
    setClearing(false);
    setClearDialogOpen(false);
  }

  // Apply filters
  const filtered = notifications.filter((n) => {
    const matchType = typeFilter === "all" || n.type === typeFilter;
    const matchUnread = !unreadOnly || !n.is_read;
    return matchType && matchUnread;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) {
    return (
      <div className="flex flex-col gap-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Notifications
          </h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
        <SkeletonList rows={5} columns={3} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Notifications
          </h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "You are all caught up"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
              onClick={() => setClearDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear all
            </Button>
          )}
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Tabs
          value={typeFilter}
          onValueChange={setTypeFilter}
          className="flex-1"
        >
          <TabsList className="flex-wrap h-auto gap-1 bg-muted/50 p-1">
            {Object.entries(TYPE_LABELS).map(([key, label]) => (
              <TabsTrigger key={key} value={key} className="text-xs h-7 px-3">
                {label}
                {key !== "all" && (
                  <Badge
                    variant="secondary"
                    className="ml-1.5 h-4 min-w-4 px-1 text-[10px] font-medium"
                  >
                    {notifications.filter((n) => n.type === key).length}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2 shrink-0">
          <Switch
            id="unread-only"
            checked={unreadOnly}
            onCheckedChange={setUnreadOnly}
            className="scale-90"
          />
          <Label
            htmlFor="unread-only"
            className="text-sm text-muted-foreground cursor-pointer"
          >
            Unread only
          </Label>
          {unreadOnly && (
            <Badge variant="secondary" className="text-[10px]">
              {notifications.filter((n) => !n.is_read).length}
            </Badge>
          )}
        </div>
      </div>

      {/* Notification List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={unreadOnly ? "No unread notifications" : "No notifications"}
          description={
            unreadOnly
              ? "You've read everything. Toggle off 'Unread only' to see all notifications."
              : typeFilter !== "all"
                ? `No ${TYPE_LABELS[typeFilter].toLowerCase()} notifications found.`
                : "You have no notifications yet. Check back after booking a session or receiving a message."
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((notification) => {
            const cardContent = (
              <CardContent className="flex items-start gap-3 p-4">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    typeColors[notification.type] ||
                    "bg-muted text-muted-foreground"
                  }`}
                >
                  {typeIcons[notification.type] || <Bell className="h-4 w-4" />}
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      {notification.title}
                    </span>
                    <div className="flex items-center gap-2">
                      {!notification.is_read && (
                        <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {notification.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {new Date(notification.created_at).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        },
                      )}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] h-4 px-1.5 capitalize"
                    >
                      {notification.type}
                    </Badge>
                    {!notification.is_read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          markAsRead(notification.id);
                        }}
                        className="text-xs text-primary hover:underline"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            );

            const cardElement = (
              <Card
                className={`border-border/60 transition-colors ${
                  !notification.is_read
                    ? "bg-primary/[0.03] border-primary/20"
                    : ""
                } ${notification.link ? "hover:bg-muted/40 cursor-pointer" : ""}`}
                onClick={() => {
                  if (!notification.is_read) {
                    markAsRead(notification.id);
                  }
                }}
              >
                {cardContent}
              </Card>
            );

            if (notification.link) {
              return (
                <Link
                  href={notification.link}
                  key={notification.id}
                  className="block no-underline"
                >
                  {cardElement}
                </Link>
              );
            }

            return <div key={notification.id}>{cardElement}</div>;
          })}
        </div>
      )}

      {/* Clear All Confirmation Dialog */}
      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all notifications?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {notifications.length}{" "}
              notification
              {notifications.length !== 1 ? "s" : ""}. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={clearAll}
              disabled={clearing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {clearing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
