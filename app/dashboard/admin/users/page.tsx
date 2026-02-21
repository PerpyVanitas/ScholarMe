"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Plus,
  Loader2,
  Users,
  MoreHorizontal,
  Pencil,
  Trash2,
  History,
  UserPlus,
  UserMinus,
  Settings,
  LogIn,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import type { Profile } from "@/lib/types";

const roleColors: Record<string, string> = {
  administrator: "bg-warning/10 text-warning-foreground border-warning/30",
  tutor: "bg-primary/10 text-primary border-primary/30",
  learner: "bg-success/10 text-success border-success/30",
};

interface LogEntry {
  id: string;
  user_id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const actionIcons: Record<string, typeof UserPlus> = {
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

function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function AdminUsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Create user
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("learner");

  // Edit user
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editUser, setEditUser] = useState<Profile | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("");

  // Delete user
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteUser, setDeleteUser] = useState<Profile | null>(null);

  // Activity logs
  const [logsOpen, setLogsOpen] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsUser, setLogsUser] = useState<Profile | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  async function loadProfiles() {
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("*, roles(name)")
      .order("created_at", { ascending: false });
    setProfiles(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadProfiles();
  }, []);

  const filtered = profiles.filter((p) => {
    const nameMatch =
      !search ||
      p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase());
    const roleMatch = roleFilter === "all" || p.roles?.name === roleFilter;
    return nameMatch && roleMatch;
  });

  async function handleCreateUser() {
    if (!newEmail || !newPassword || !newName) {
      toast.error("Please fill all fields");
      return;
    }
    setCreateLoading(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: newEmail,
        password: newPassword,
        full_name: newName,
        role_name: newRole,
      }),
    });
    if (res.ok) {
      toast.success("User created successfully");
      setCreateOpen(false);
      setNewEmail("");
      setNewPassword("");
      setNewName("");
      setNewRole("learner");
      loadProfiles();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to create user");
    }
    setCreateLoading(false);
  }

  function openEdit(p: Profile) {
    setEditUser(p);
    setEditName(p.full_name || "");
    setEditEmail(p.email || "");
    setEditRole(p.roles?.name || "learner");
    setEditOpen(true);
  }

  async function handleEditUser() {
    if (!editUser) return;
    setEditLoading(true);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: editUser.id,
        full_name: editName,
        email: editEmail !== editUser.email ? editEmail : undefined,
        role_name: editRole !== editUser.roles?.name ? editRole : undefined,
      }),
    });
    if (res.ok) {
      toast.success("User updated successfully");
      setEditOpen(false);
      loadProfiles();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to update user");
    }
    setEditLoading(false);
  }

  function openDelete(p: Profile) {
    setDeleteUser(p);
    setDeleteOpen(true);
  }

  async function handleDeleteUser() {
    if (!deleteUser) return;
    setDeleteLoading(true);
    const res = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: deleteUser.id }),
    });
    if (res.ok) {
      toast.success("User deleted successfully");
      setDeleteOpen(false);
      setDeleteUser(null);
      loadProfiles();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to delete user");
    }
    setDeleteLoading(false);
  }

  async function openLogs(p: Profile) {
    setLogsUser(p);
    setLogsOpen(true);
    setLogsLoading(true);
    setLogs([]);
    const res = await fetch(`/api/admin/users/${p.id}/logs`);
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs || []);
    } else {
      toast.error("Failed to load activity logs");
    }
    setLogsLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">User Management</h1>
          <p className="text-muted-foreground">Create, edit, and manage user accounts.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>Create an account for a learner, tutor, or administrator.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label>Full Name</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="John Doe" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Email</Label>
                <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} type="email" placeholder="john@example.com" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Password</Label>
                <Input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" placeholder="Minimum 6 characters" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Role</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="learner">Learner</SelectItem>
                    <SelectItem value="tutor">Tutor</SelectItem>
                    <SelectItem value="administrator">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateUser} disabled={createLoading}>
                {createLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="learner">Learner</SelectItem>
            <SelectItem value="tutor">Tutor</SelectItem>
            <SelectItem value="administrator">Administrator</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <div className="rounded-full bg-muted p-4">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No users found</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {filtered.map((p) => (
              <Card key={p.id} className="border-border/60">
                <CardContent className="flex items-center gap-3 p-4">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">{getInitials(p.full_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <span className="font-medium text-foreground truncate">{p.full_name || "Unnamed"}</span>
                    <span className="text-xs text-muted-foreground truncate">{p.email}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={`text-[10px] ${roleColors[p.roles?.name || "learner"]}`}>
                        {p.roles?.name || "learner"}
                      </Badge>
                    </div>
                  </div>
                  <UserActionsMenu profile={p} onEdit={openEdit} onDelete={openDelete} onLogs={openLogs} />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop table */}
          <Card className="border-border/60 hidden md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">{getInitials(p.full_name)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-foreground">{p.full_name || "Unnamed"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{p.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={roleColors[p.roles?.name || "learner"]}>
                          {p.roles?.name || "learner"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </TableCell>
                      <TableCell>
                        <UserActionsMenu profile={p} onEdit={openEdit} onDelete={openDelete} onLogs={openLogs} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update account details for {editUser?.full_name || "this user"}.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label>Full Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Email</Label>
              <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} type="email" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Role</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="learner">Learner</SelectItem>
                  <SelectItem value="tutor">Tutor</SelectItem>
                  <SelectItem value="administrator">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEditUser} disabled={editLoading}>
              {editLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold text-foreground">{deleteUser?.full_name || deleteUser?.email}</span>?
              This will remove their profile, sessions, and all associated data. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Activity Logs Sheet */}
      <Sheet open={logsOpen} onOpenChange={setLogsOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Activity History</SheetTitle>
            <SheetDescription>
              Action history for {logsUser?.full_name || logsUser?.email || "this user"}.
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
                <p className="text-sm text-muted-foreground">No activity recorded yet</p>
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
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {Object.entries(log.metadata).map(([key, value]) =>
                                value ? (
                                  <span key={key} className="text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                    {key.replace(/_/g, " ")}: {String(value)}
                                  </span>
                                ) : null
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
    </div>
  );
}

// -- Actions dropdown used in both mobile and desktop views --
function UserActionsMenu({
  profile,
  onEdit,
  onDelete,
  onLogs,
}: {
  profile: Profile;
  onEdit: (p: Profile) => void;
  onDelete: (p: Profile) => void;
  onLogs: (p: Profile) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Actions for {profile.full_name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(profile)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onLogs(profile)}>
          <History className="mr-2 h-4 w-4" />
          View Activity
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onDelete(profile)} className="text-destructive focus:text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete User
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
