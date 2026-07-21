"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/lib/user-context";
import type { Profile } from "@/lib/types";
import { format } from "date-fns";

interface UserEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: Profile | null;
  onEdited: () => void;
}

function getUserRoleName(roles: unknown): string {
  if (Array.isArray(roles) && roles.length > 0) return roles[0].name;
  if (roles && typeof roles === "object" && !Array.isArray(roles))
    // @ts-ignore: Strict unknown type check
    return roles.name;
  return "learner";
}

export function UserEditDialog({
  open,
  onOpenChange,
  user,
  onEdited,
}: UserEditDialogProps) {
  const { role: currentAdminRole } = useUser();
  const [editLoading, setEditLoading] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editRoleExpiresAt, setEditRoleExpiresAt] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [showEditPassword, setShowEditPassword] = useState(false);

  useEffect(() => {
    if (user && open) {
      setEditName(user.full_name || "");
      setEditEmail(user.email || "");
      setEditRole(getUserRoleName(user.roles));
      setEditRoleExpiresAt(
        user.role_expires_at ? user.role_expires_at.split("T")[0] : "",
      );
      setEditPassword("");
      setShowEditPassword(false);
    }
  }, [user, open]);

  async function handleEditUser() {
    if (!user) return;
    setEditLoading(true);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.id,
        full_name: editName,
        email: editEmail !== user.email ? editEmail : undefined,
        role_name:
          editRole !== getUserRoleName(user.roles) ? editRole : undefined,
        role_expires_at: editRoleExpiresAt
          ? new Date(editRoleExpiresAt).toISOString()
          : null,
        password: editPassword ? editPassword : undefined,
      }),
    });
    if (res.ok) {
      toast.success("User updated successfully");
      onEdited();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to update user");
    }
    setEditLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update account details for {user?.full_name || "this user"}.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label>Full Name</Label>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Email</Label>
            <Input
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              type="email"
            />
          </div>
          {currentAdminRole === "super_admin" ? (
            <>
              <div className="flex flex-col gap-2">
                <Label>Role</Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="learner">Learner</SelectItem>
                    <SelectItem value="tutor">Tutor</SelectItem>
                    <SelectItem value="committee_head">
                      Committee Head
                    </SelectItem>
                    <SelectItem value="administrator">Administrator</SelectItem>
                    <SelectItem value="finance_manager">
                      Finance Manager
                    </SelectItem>
                    <SelectItem value="treasurer">Treasurer</SelectItem>
                    <SelectItem value="auditor">Auditor</SelectItem>
                    <SelectItem value="president">President</SelectItem>
                    <SelectItem value="faculty_adviser">
                      Faculty Adviser
                    </SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editRole !== "learner" && (
                <div className="flex flex-col gap-2">
                  <Label>Role Expiration Date</Label>
                  <Input
                    type="date"
                    value={editRoleExpiresAt}
                    onChange={(e) => setEditRoleExpiresAt(e.target.value)}
                    placeholder="Leave empty for permanent"
                  />
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <Label>Role</Label>
              <div className="text-sm px-3 py-2 border rounded-md bg-muted text-muted-foreground capitalize">
                {editRole || "learner"}
              </div>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label>New Password</Label>
            <div className="relative">
              <Input
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                type={showEditPassword ? "text" : "password"}
                placeholder="Leave blank to keep current password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowEditPassword(!showEditPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showEditPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleEditUser} disabled={editLoading}>
            {editLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
