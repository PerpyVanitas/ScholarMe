"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Loader2, ShieldAlert, History } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { assignRole, getRoleHistory } from "@/app/actions/roles";
import { toast } from "sonner";
import { SkeletonList } from "@/components/ui/skeleton-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { UserRole } from "@/lib/types";

const ALL_ROLES: { value: UserRole; label: string }[] = [
  { value: "learner", label: "Learner" },
  { value: "tutor", label: "Tutor" },
  { value: "finance_manager", label: "Finance Manager" },
  { value: "auditor", label: "Auditor" },
  { value: "president", label: "President" },
  { value: "treasurer", label: "Treasurer" },
  { value: "committee_head", label: "Committee Head" },
  { value: "faculty_adviser", label: "Faculty Adviser" },
  { value: "administrator", label: "Administrator" },
];

export default function AdminRolesPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Update state
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>(
    {},
  );

  // History modal state
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [historyUser, setHistoryUser] = useState<any | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*, roles(name)")
      .order("created_at", { ascending: false });

    if (data) {
      setUsers(data);
      // Initialize selected roles
      const initialRoles: Record<string, string> = {};
      data.forEach((u) => {
        initialRoles[u.id] =
          (Array.isArray(u.roles) ? u.roles[0]?.name : u.roles?.name) ||
          "learner";
      });
      setSelectedRoles(initialRoles);
    }
    setLoading(false);
  }

  const filteredUsers = users.filter(
    (u) =>
      !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleAssignRole(userId: string) {
    const newRole = selectedRoles[userId];
    const oldRole =
      (Array.isArray(users.find((u) => u.id === userId)?.roles)
        ? users.find((u) => u.id === userId)?.roles[0]?.name
        : users.find((u) => u.id === userId)?.roles?.name) || "learner";

    if (newRole === oldRole) {
      toast.info("User already has this role.");
      return;
    }

    setUpdatingId(userId);
    const result = await assignRole(userId, newRole, `Changed from ${oldRole}`);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Role updated successfully.");
      loadUsers();
    }
    setUpdatingId(null);
  }

  async function viewHistory(user: any) {
    setHistoryUser(user);
    setHistoryOpen(true);
    setHistoryLoading(true);

    const result = await getRoleHistory(user.id);
    if (result.error) {
      toast.error("Failed to load history.");
    } else {
      setHistoryLogs(result.logs);
    }
    setHistoryLoading(false);
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Role Management
          </h1>
          <p className="text-muted-foreground">
            Assign and manage system access levels.
          </p>
        </div>
        <SkeletonList rows={5} columns={1} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-primary" />
            Role Management
          </h1>
          <p className="text-muted-foreground">
            Assign and manage system access levels.
          </p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">User Roles</CardTitle>
          <CardDescription>
            Carefully assign roles as they grant elevated permissions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredUsers.map((u) => {
              const currentRole =
                (Array.isArray(u.roles) ? u.roles[0]?.name : u.roles?.name) ||
                "learner";
              const selectedRole = selectedRoles[u.id] || currentRole;
              const isDirty = selectedRole !== currentRole;
              const isUpdating = updatingId === u.id;

              return (
                <div
                  key={u.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border/50 rounded-lg gap-4 bg-card/50"
                >
                  <div>
                    <h3 className="font-medium text-foreground">
                      {u.full_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{u.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md border">
                        Current:{" "}
                        {ALL_ROLES.find((r) => r.value === currentRole)
                          ?.label || currentRole}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs px-2"
                        onClick={() => viewHistory(u)}
                      >
                        <History className="h-3 w-3 mr-1" /> History
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select
                      value={selectedRole}
                      onValueChange={(val) =>
                        setSelectedRoles({ ...selectedRoles, [u.id]: val })
                      }
                      disabled={isUpdating}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_ROLES.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {isDirty ? (
                      <ConfirmDialog
                        trigger={
                          <Button
                            disabled={isUpdating}
                            size="sm"
                            variant={
                              selectedRole === "administrator"
                                ? "destructive"
                                : "default"
                            }
                          >
                            {isUpdating ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Save"
                            )}
                          </Button>
                        }
                        title={`Assign ${ALL_ROLES.find((r) => r.value === selectedRole)?.label} role?`}
                        description={`This will change ${u.full_name}'s permissions across the entire platform. Are you sure?`}
                        confirmLabel="Confirm Assignment"
                        onConfirm={() => handleAssignRole(u.id)}
                      />
                    ) : (
                      <Button
                        disabled
                        size="sm"
                        variant="outline"
                        className="w-[60px]"
                      >
                        Saved
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredUsers.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No users found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* History Dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Role History</DialogTitle>
            <DialogDescription>
              Role changes for {historyUser?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {historyLoading ? (
              <div className="flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : historyLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center">
                No role history found for this user.
              </p>
            ) : (
              <div className="space-y-4">
                {historyLogs.map((log) => (
                  <div
                    key={log.id}
                    className="text-sm border-l-2 border-primary pl-4 py-1"
                  >
                    <p className="font-medium">
                      Assigned: {log.metadata?.new_role}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                    {log.metadata?.notes && (
                      <p className="text-muted-foreground mt-1 text-xs italic">
                        "{log.metadata.notes}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
