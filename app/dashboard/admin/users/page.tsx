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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Loader2,
  Users,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Profile } from "@/lib/types";
import { ExportCsvButton } from "@/components/export-csv-button";
import { BulkIdExporter } from "./components/bulk-id-exporter";

// Import new modular components
import { UserCreateDialog } from "./components/user-create-dialog";
import { UserEditDialog } from "./components/user-edit-dialog";
import { UserDeleteDialog } from "./components/user-delete-dialog";
import { UserLogsDialog } from "./components/user-logs-dialog";
import { UserDesignationsDialog } from "./components/user-designations-dialog";
import { UserIdCardDialog } from "./components/user-id-card-dialog";
import { UserProfileDialog } from "./components/user-profile-dialog";
import { BulkUserImportDialog } from "./components/bulk-user-import-dialog";
import { UsersDataTable } from "./components/users-data-table";

function getUserRoleName(roles: unknown): string {
  if (Array.isArray(roles) && roles.length > 0) return roles[0].name;
  if (roles && typeof roles === "object" && !Array.isArray(roles))
    // @ts-expect-error: Strict unknown type check
    return roles.name;
  return "learner";
}

function AdminUsersContent() {
  const searchParams = useSearchParams();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const { role } = useUser();

  // Pagination state (P14-9)
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const LIMIT = 20;

  // Create state
  const [createOpen, setCreateOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);

  // Impersonation link dialog state
  const [impersonateLink, setImpersonateLink] = useState<string | null>(null);

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

  // Reset page on search or filter change
  useEffect(() => {
    setPage(1);
  }, [search, roleFilter]);

  async function loadProfiles() {
    setLoading(true);
    const supabase = createClient();
    
    let selectString = "*, roles(name)";
    if (roleFilter !== "all") {
      selectString = "*, roles!inner(name)";
    }

    let query = supabase
      .from("profiles")
      .select(selectString, { count: "exact" })
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (roleFilter !== "all") {
      query = query.eq("roles.name", roleFilter);
    }
    const offset = (page - 1) * LIMIT;
    const { data, count, error } = await query.range(offset, offset + LIMIT - 1);

    if (error) {
      console.error(error);
    }

    const profilesData = (data as unknown as Profile[]) || [];
    setProfiles(profilesData);
    setTotalUsers(count || 0);

    const userId = searchParams.get("userId");
    if (userId && profilesData.length > 0) {
      const p = profilesData.find((u) => u.id === userId);
      if (p) {
        setLogsUser(p);
        setLogsOpen(true);
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    // Only load if search is stable (could use a debounce hook here in a real app)
    const timeout = setTimeout(() => {
      loadProfiles();
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchParams, search, roleFilter, page]);

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

  async function handleQuickRoleEdit(userId: string, newRole: string) {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, role_name: newRole }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to update role");
      }
      toast.success("Role updated successfully");
      loadProfiles();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error updating role");
    }
  }

  function openPrintId(p: Profile) {
    setIdCardUser(p);
    setIdCardOpen(true);
  }

  function toggleAllSelection(filteredProfiles: Profile[]) {
    if (selectedUserIds.size === filteredProfiles.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(filteredProfiles.map((p) => p.id)));
    }
  }

  async function handleImpersonate(p: Profile) {
    try {
      const loadingToastId = toast.loading("Generating impersonation link...");
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: p.email }),
      });

      toast.dismiss(loadingToastId);

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || `Server error: ${res.status}`);
      }

      const { link } = await res.json();

      // Try clipboard first; fall back to showing a dialog
      try {
        await navigator.clipboard.writeText(link);
        toast.success(
          "Impersonation link copied! Open it in an Incognito window.",
          { duration: 6000 },
        );
      } catch {
        // Clipboard not available (HTTP / permissions) — show dialog instead
        setImpersonateLink(link);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: unknown) {
      // @ts-expect-error: Strict unknown type check
      toast.error(e.message || "Failed to generate impersonation link");
    }
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
            data={profiles.map((p) => ({
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
          <Button
            variant="outline"
            onClick={() => setBulkImportOpen(true)}
            className="hidden sm:flex"
          >
            <Users className="mr-2 h-4 w-4" />
            Bulk Import
          </Button>
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

      <UsersDataTable
        filtered={profiles}
        selectedUserIds={selectedUserIds}
        toggleAllSelection={toggleAllSelection}
        toggleUserSelection={toggleUserSelection}
        openEdit={openEdit}
        openProfile={openProfile}
        openDelete={openDelete}
        openLogs={openLogs}
        openPrintId={openPrintId}
        openDesignations={openDesignations}
        handleImpersonate={handleImpersonate}
        handleQuickRoleEdit={handleQuickRoleEdit}
        role={role}
      />

      {totalUsers > LIMIT && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * LIMIT) + 1} to {Math.min(page * LIMIT, totalUsers)} of {totalUsers} users
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page * LIMIT >= totalUsers}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
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

      <BulkUserImportDialog
        open={bulkImportOpen}
        onOpenChange={setBulkImportOpen}
        onImported={() => {
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

      {/* Impersonation Fallback Dialog — shown when clipboard is unavailable */}
      <Dialog
        open={!!impersonateLink}
        onOpenChange={(o) => !o && setImpersonateLink(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Impersonation Link Generated</DialogTitle>
            <DialogDescription>
              Clipboard access was blocked. Copy this link manually and open it
              in an <strong>Incognito / Private</strong> browser window.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 flex flex-col gap-3">
            <textarea
              readOnly
              rows={4}
              value={impersonateLink ?? ""}
              className="w-full rounded-md border border-input bg-muted p-3 text-xs font-mono resize-none focus:outline-none"
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            />
            <p className="text-xs text-muted-foreground">
              Click the box above to select all, then copy manually.
            </p>
          </div>
        </DialogContent>
      </Dialog>
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
