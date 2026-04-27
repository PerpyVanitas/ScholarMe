/** Notifications page -- view, mark-read, and mark-all-read for the current user. */
"use client";

import { useState, useEffect, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Calendar, BookOpen, Settings, CheckCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getDemoUserFromCookie } from "@/lib/demo";
import type { Notification } from "@/lib/types";

const typeIcons: Record<string, ReactNode> = {
  session: <Calendar className="h-4 w-4" />,
  resource: <BookOpen className="h-4 w-4" />,
  system: <Settings className="h-4 w-4" />,
};

const typeColors: Record<string, string> = {
  session: "bg-primary/10 text-primary",
  resource: "bg-accent/30 text-accent-foreground",
  system: "bg-muted text-muted-foreground",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      let userId = user?.id;
      if (!userId) {
        // Default to lowest-privilege demo role
        userId = getDemoUserFromCookie("learner").userId;
      }

      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);
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
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
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
      .in("id", unread.map((n) => n.id));

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success("All notifications marked as read");
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "You are all caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <div className="rounded-full bg-muted p-4">
              <Bell className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`border-border/60 transition-colors ${
                !notification.is_read ? "bg-primary/[0.03] border-primary/20" : ""
              }`}
            >
              <CardContent className="flex items-start gap-3 p-4">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${typeColors[notification.type]}`}>
                  {typeIcons[notification.type]}
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      {notification.title}
                    </span>
                    {!notification.is_read && (
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {notification.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {new Date(notification.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                    {!notification.is_read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-xs text-primary hover:underline"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
