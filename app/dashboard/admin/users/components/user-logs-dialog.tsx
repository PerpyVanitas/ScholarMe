"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Loader2,
  History,
  UserPlus,
  UserMinus,
  Settings,
  LogIn,
  FileText,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import type { Profile } from "@/lib/types";

interface LogEntry {
  id: string;
  user_id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const actionIcons: Record<string, any> = {
  user_created: UserPlus,
  user_edited: Settings,
  user_deleted: UserMinus,
  account_deleted: UserMinus,
  login: LogIn,
  session_created: FileText,
  session_completed: FileText,
};

const actionLabels: Record<string, string> = {
  user_created: "Account Created",
  user_edited: "Account Edited",
  user_deleted: "Account Deleted",
  account_deleted: "Self-Deleted Account",
  login: "Logged In",
  session_created: "Session Created",
  session_completed: "Session Completed",
  resource_uploaded: "Resource Uploaded",
  repository_created: "Repository Created",
};

interface UserLogsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: Profile | null;
}

export function UserLogsDialog({
  open,
  onOpenChange,
  user,
}: UserLogsDialogProps) {
  const [logsLoading, setLogsLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    if (user && open) {
      loadLogs();
    }
  }, [user, open]);

  async function loadLogs() {
    if (!user) return;
    setLogsLoading(true);
    setLogs([]);
    const res = await fetch(`/api/admin/users/${user.id}/logs`);
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs || []);
    } else {
      toast.error("Failed to load activity logs");
    }
    setLogsLoading(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Activity History</SheetTitle>
          <SheetDescription>
            Action history for {user?.full_name || user?.email || "this user"}.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          {logsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12">
              <History className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No activity recorded yet
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-0">
              {logs.map((log, i) => {
                const Icon = actionIcons[log.action] || History;
                return (
                  <div key={log.id}>
                    <div className="flex gap-3 py-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-sm font-medium text-foreground">
                          {actionLabels[log.action] || log.action}
                        </span>
                        {log.metadata &&
                          Object.keys(log.metadata).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {Object.entries(log.metadata).map(
                                ([key, value]) =>
                                  value ? (
                                    <span
                                      key={key}
                                      className="text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded"
                                    >
                                      {key.replace(/_/g, " ")}: {String(value)}
                                    </span>
                                  ) : null,
                              )}
                            </div>
                          )}
                        <span className="text-[11px] text-muted-foreground mt-0.5">
                          {new Date(log.created_at).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                    {i < logs.length - 1 && <Separator />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
