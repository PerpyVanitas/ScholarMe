"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/user-context";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import {
  Search,
  Plus,
  Loader2,
  Users,
  MoreHorizontal,
  Pencil,
  Trash2,
  History,
  FileText,
  Award,
} from "lucide-react";
import type { Profile } from "@/lib/types";
import { ExportCsvButton } from "@/components/export-csv-button";
import { Checkbox } from "@/components/ui/checkbox";
import { BulkIdExporter } from "./components/bulk-id-exporter";

// Import new modular components
import { UserCreateDialog } from "./components/user-create-dialog";
import { UserEditDialog } from "./components/user-edit-dialog";
import { UserDeleteDialog } from "./components/user-delete-dialog";
import { UserLogsDialog } from "./components/user-logs-dialog";
import { UserDesignationsDialog } from "./components/user-designations-dialog";
import { UserIdCardDialog } from "./components/user-id-card-dialog";
import { UserProfileDialog } from "./components/user-profile-dialog";

const roleColors: Record<string, string> = {
  super_admin: "bg-red-500/10 text-red-500 border-red-500/30",
  president: "bg-purple-500/10 text-purple-500 border-purple-500/30",
  administrator: "bg-warning/10 text-warning-foreground border-warning/30",
  treasurer: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
  auditor: "bg-orange-500/10 text-orange-500 border-orange-500/30",
  finance_manager: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  committee_head: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  faculty_adviser: "bg-pink-500/10 text-pink-500 border-pink-500/30",
  tutor: "bg-primary/10 text-primary border-primary/30",
  learner: "bg-success/10 text-success border-success/30",
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

function getUserRoleName(roles: any): string {
  if (Array.isArray(roles) && roles.length > 0) return roles[0].name;
  if (roles && typeof roles === "object" && !Array.isArray(roles))
    return roles.name;
  return "learner";
}

function AdminUsersContent() {
  const searchParams = useSearchParams();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Create state
  const [createOpen, setCreateOpen] = useState(false);

  // Profile view state
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileUser, setProfileUser] = useState<Profile | null>(null);

  // Bulk selection state
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(
    new Set(),
  );

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<Profile | null>(null);

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState<Profile | null>(null);

  // Logs state
  const [logsOpen, setLogsOpen] = useState(false);
  const [logsUser, setLogsUser] = useState<Profile | null>(null);

  // Designations state
  const [designationsOpen, setDesignationsOpen] = useState(false);
  const [designationsUser, setDesignationsUser] = useState<Profile | null>(
    null,
  );

  // ID Card state
  const [idCardOpen, setIdCardOpen] = useState(false);
  const [idCardUser, setIdCardUser] = useState<Profile | null>(null);

  async function loadProfiles() {
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("*, roles(name)")
      .order("created_at", { ascending: false });

    setProfiles(data || []);

    const userId = searchParams.get("userId");
    if (userId && data) {
      const p = data.find((u) => u.id === userId);
      if (p) {
        setLogsUser(p);
        setLogsOpen(true);
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    loadProfiles();
  }, [searchParams]);

  function openEdit(p: Profile) {
    setEditUser(p);
    setEditOpen(true);
  }

  function openProfile(p: Profile) {
    setProfileUser(p);
    setProfileOpen(true);
  }

  function openDelete(p: Profile) {
    setDeleteUser(p);
    setDeleteOpen(true);
  }

  function openLogs(p: Profile) {
    setLogsUser(p);
    setLogsOpen(true);
  }

  function openDesignations(p: Profile) {
    setDesignationsUser(p);
    setDesignationsOpen(true);
  }

  function openPrintId(p: Profile) {
    setIdCardUser(p);
    setIdCardOpen(true);
  }

  function toggleUserSelection(userId: string) {
    const newSet = new Set(selectedUserIds);
    if (newSet.has(userId)) {
      newSet.delete(userId);
    } else {
      newSet.add(userId);
    }
    setSelectedUserIds(newSet);
  }

  function toggleAllSelection(filteredProfiles: Profile[]) {
    if (
      selectedUserIds.size === filteredProfiles.length &&
      filteredProfiles.length > 0
    ) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(filteredProfiles.map((p) => p.id)));
    }
  }

  const filtered = profiles.filter((p) => {
    const nameMatch =
      !search ||
      p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole =
      roleFilter === "all" || getUserRoleName(p.roles) === roleFilter;
    return nameMatch && matchesRole;
  });

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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            User Management
          </h1>
          <p className="text-muted-foreground">
            Create, edit, and manage user accounts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BulkIdExporter
            selectedUsers={profiles.filter((p) => selectedUserIds.has(p.id))}
            onClearSelection={() => setSelectedUserIds(new Set())}
          />
          <ExportCsvButton
            data={filtered.map((p) => ({
              Name: p.full_name,
              Email: p.email,
              Role: getUserRoleName(p.roles),
              "Member #": p.membership_number ?? "",
              Program: p.degree_program ?? "",
              "Year Level": p.year_level ?? "",
              Joined: new Date(p.created_at).toLocaleDateString(),
            }))}
            filename="users_export"
          />
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create User
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="learner">Learner</SelectItem>
            <SelectItem value="tutor">Tutor</SelectItem>
            <SelectItem value="committee_head">Committee Head</SelectItem>
            <SelectItem value="administrator">Administrator</SelectItem>
            <SelectItem value="finance_manager">Finance Manager</SelectItem>
            <SelectItem value="treasurer">Treasurer</SelectItem>
            <SelectItem value="auditor">Auditor</SelectItem>
            <SelectItem value="president">President</SelectItem>
            <SelectItem value="faculty_adviser">Faculty Adviser</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
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
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {getInitials(p.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <span className="font-medium text-foreground truncate">
                      {p.full_name || "Unnamed"}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {p.email}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${roleColors[getUserRoleName(p.roles)]}`}
                      >
                        {getUserRoleName(p.roles)}
                      </Badge>
                    </div>
                  </div>
                  <UserActionsMenu
                    profile={p}
                    onProfile={openProfile}
                    onEdit={openEdit}
                    onDelete={openDelete}
                    onLogs={openLogs}
                    onPrintId={openPrintId}
                    onDesignations={openDesignations}
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop table */}
          <Card className="border-border/60 hidden md:block">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          filtered.length > 0 &&
                          selectedUserIds.size === filtered.length
                        }
                        onCheckedChange={() => toggleAllSelection(filtered)}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-12">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow
                      key={p.id}
                      onDoubleClick={() => openEdit(p)}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedUserIds.has(p.id)}
                          onCheckedChange={() => toggleUserSelection(p.id)}
                          aria-label={`Select ${p.full_name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {getInitials(p.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-foreground">
                            {p.full_name || "Unnamed"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.email}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={roleColors[getUserRoleName(p.roles)]}
                        >
                          {getUserRoleName(p.roles)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(p.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="hidden md:flex"
                            onClick={() => openProfile(p)}
                          >
                            <Users className="h-3.5 w-3.5 mr-1.5" />
                            View Profile
                          </Button>
                          <UserActionsMenu
                            profile={p}
                            onProfile={openProfile}
                            onEdit={openEdit}
                            onDelete={openDelete}
                            onLogs={openLogs}
                            onPrintId={openPrintId}
                            onDesignations={openDesignations}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* Extracted Modular Dialogs */}
      <UserCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          setCreateOpen(false);
          loadProfiles();
        }}
      />

      <UserEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        user={editUser}
        onEdited={() => {
          setEditOpen(false);
          loadProfiles();
        }}
      />

      <UserDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        user={deleteUser}
        onDeleted={() => {
          setDeleteOpen(false);
          loadProfiles();
        }}
      />

      <UserLogsDialog
        open={logsOpen}
        onOpenChange={setLogsOpen}
        user={logsUser}
      />

      <UserDesignationsDialog
        open={designationsOpen}
        onOpenChange={setDesignationsOpen}
        user={designationsUser}
      />

      <UserIdCardDialog
        open={idCardOpen}
        onOpenChange={setIdCardOpen}
        user={idCardUser}
        onUpdateUser={(updated) => {
          setProfiles((prev) =>
            prev.map((p) => (p.id === updated.id ? updated : p)),
          );
          setIdCardUser(updated);
        }}
      />

      <UserProfileDialog
        open={profileOpen}
        onOpenChange={setProfileOpen}
        user={profileUser}
      />
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AdminUsersContent />
    </Suspense>
  );
}

function UserActionsMenu({
  profile,
  onProfile,
  onEdit,
  onDelete,
  onLogs,
  onPrintId,
  onDesignations,
}: {
  profile: Profile;
  onProfile: (p: Profile) => void;
  onEdit: (p: Profile) => void;
  onDelete: (p: Profile) => void;
  onLogs: (p: Profile) => void;
  onPrintId: (p: Profile) => void;
  onDesignations: (p: Profile) => void;
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
        <DropdownMenuItem onClick={() => onProfile(profile)}>
          <Users className="mr-2 h-4 w-4" />
          View Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(profile)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onPrintId(profile)}>
          <FileText className="mr-2 h-4 w-4" />
          Print/Download ID
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onLogs(profile)}>
          <History className="mr-2 h-4 w-4" />
          View Activity
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDesignations(profile)}>
          <Award className="mr-2 h-4 w-4" />
          Manage Status
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete(profile)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete User
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
