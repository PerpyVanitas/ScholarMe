"use client";

import { useState } from "react";
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

interface UserCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function UserCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: UserCreateDialogProps) {
  const { role: currentAdminRole } = useUser();
  const [createLoading, setCreateLoading] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("learner");
  const [showCreatePassword, setShowCreatePassword] = useState(false);

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
      setNewEmail("");
      setNewPassword("");
      setNewName("");
      setNewRole("learner");
      onCreated();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to create user");
    }
    setCreateLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Create an account for a learner, tutor, or administrator.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label>Full Name</Label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="John Doe"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Email</Label>
            <Input
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              type="email"
              placeholder="john@example.com"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Password</Label>
            <div className="relative">
              <Input
                value={newPassword}
                onChange={(e: any) => setNewPassword(e.target.value)}
                type={showCreatePassword ? "text" : "password"}
                placeholder="Minimum 6 characters"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCreatePassword(!showCreatePassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCreatePassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          {currentAdminRole === "super_admin" && (
            <div className="flex flex-col gap-2">
              <Label>Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="learner">Learner</SelectItem>
                  <SelectItem value="tutor">Tutor</SelectItem>
                  <SelectItem value="committee_head">Committee Head</SelectItem>
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
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateUser} disabled={createLoading}>
            {createLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Create User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
