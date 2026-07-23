"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Edit2,
  Trash2,
  Shield,
  GraduationCap,
  Crown,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import type { Profile, HsDesignation, DesignationType } from "@/lib/types";

interface UserDesignationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: Profile | null;
}

function getUserRoleName(roles: unknown): string {
  if (Array.isArray(roles) && roles.length > 0) return roles[0].name;
  if (roles && typeof roles === "object" && !Array.isArray(roles))
    // @ts-expect-error: Strict unknown type check
    return roles.name;
  return "learner";
}

export function UserDesignationsDialog({
  open,
  onOpenChange,
  user,
}: UserDesignationsDialogProps) {
  const [designationsLoading, setDesignationsLoading] = useState(false);
  const [designations, setDesignations] = useState<HsDesignation[]>([]);
  const [editingDesignation, setEditingDesignation] =
    useState<HsDesignation | null>(null);
  const [desigType, setDesigType] = useState<DesignationType>("member");
  const [desigPosition, setDesigPosition] = useState("");
  const [desigAcademicYear, setDesigAcademicYear] = useState("");
  const [desigIsCurrent, setDesigIsCurrent] = useState(true);
  const [savingDesignation, setSavingDesignation] = useState(false);

  useEffect(() => {
    if (user && open) {
      loadDesignations();
    }
  }, [user, open]);

  async function loadDesignations() {
    if (!user) return;
    setDesignationsLoading(true);
    setDesignations([]);
    setEditingDesignation(null);
    setDesigType("member");
    setDesigPosition("");
    setDesigAcademicYear("");
    setDesigIsCurrent(true);

    const res = await fetch(`/api/admin/users/designations?userId=${user.id}`);
    if (res.ok) {
      const data = await res.json();
      setDesignations(data.designations || []);
    }
    setDesignationsLoading(false);
  }

  async function handleSaveDesignation() {
    if (!user) return;
    setSavingDesignation(true);
    try {
      const payload = {
        user_id: user.id,
        designation: desigType,
        position: desigType === "officer" ? desigPosition : null,
        academic_year: desigAcademicYear,
        is_current: desigIsCurrent,
      };

      if (editingDesignation) {
        const res = await fetch("/api/admin/users/designations", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            designation_id: editingDesignation.id,
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        const data = await res.json();
        setDesignations((prev) =>
          prev.map((d) =>
            d.id === editingDesignation.id
              ? data.designation
              : desigIsCurrent
                ? { ...d, is_current: false }
                : d,
          ),
        );
        toast.success("Designation updated");
      } else {
        const res = await fetch("/api/admin/users/designations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        const data = await res.json();
        setDesignations((prev) =>
          desigIsCurrent
            ? [
                data.designation,
                ...prev.map((d) => ({ ...d, is_current: false })),
              ]
            : [data.designation, ...prev],
        );
        toast.success("Designation added");
      }
      setEditingDesignation(null);
      setDesigType("member");
      setDesigPosition("");
      setDesigAcademicYear("");
      setDesigIsCurrent(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: unknown) {
      // @ts-expect-error: Strict unknown type check
      toast.error(e.message || "Failed to save designation");
    } finally {
      setSavingDesignation(false);
    }
  }

  async function handleDeleteDesignation(id: string) {
    if (!user) return;
    try {
      const res = await fetch("/api/admin/users/designations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, designation_id: id }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setDesignations((prev) => prev.filter((d) => d.id !== id));
      toast.success("Designation removed");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: unknown) {
      // @ts-expect-error: Strict unknown type check
      toast.error(e.message || "Failed to remove designation");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Honor Society Status</DialogTitle>
          <DialogDescription>
            Manage designations for {user?.full_name || "this user"}.
          </DialogDescription>
        </DialogHeader>

        {designationsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 bg-muted/30 p-4 rounded-lg border">
              <h4 className="font-semibold text-sm">
                {editingDesignation ? "Edit Designation" : "Add Designation"}
              </h4>
              <div className="grid gap-2">
                <Label htmlFor="desigType">Designation Type</Label>
                <Select
                  value={desigType}
                  onValueChange={(v) => setDesigType(v as DesignationType)}
                >
                  <SelectTrigger id="desigType">
                    <SelectValue placeholder="Select designation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="officer">Officer</SelectItem>
                    <SelectItem value="administrator">Administrator</SelectItem>
                    <SelectItem value="esas_scholar">ESAS Scholar</SelectItem>
                    {getUserRoleName(user?.roles) === "super_admin" && (
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              {desigType === "officer" && (
                <div className="grid gap-2">
                  <Label htmlFor="desigPosition">Position Title</Label>
                  <Input
                    id="desigPosition"
                    value={desigPosition}
                    onChange={(e) => setDesigPosition(e.target.value)}
                    placeholder="e.g. President, Secretary"
                  />
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="desigAcademicYear">Academic Year</Label>
                <Input
                  id="desigAcademicYear"
                  value={desigAcademicYear}
                  onChange={(e) => setDesigAcademicYear(e.target.value)}
                  placeholder="e.g. 2024-2025"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="desigIsCurrent"
                  checked={desigIsCurrent}
                  onChange={(e) => setDesigIsCurrent(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="desigIsCurrent" className="font-normal">
                  This is their current designation
                </Label>
              </div>
              <div className="flex gap-2 justify-end mt-2">
                {editingDesignation && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEditingDesignation(null);
                      setDesigType("member");
                      setDesigPosition("");
                      setDesigAcademicYear("");
                      setDesigIsCurrent(true);
                    }}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  onClick={handleSaveDesignation}
                  disabled={
                    savingDesignation ||
                    !desigAcademicYear ||
                    (desigType === "officer" && !desigPosition)
                  }
                >
                  {savingDesignation && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingDesignation ? "Update Status" : "Add Status"}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Current Status History</h4>
              {designations.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No designations recorded.
                </p>
              ) : (
                <div className="space-y-2">
                  {designations.map((d) => (
                    <div
                      key={d.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        d.is_current
                          ? "border-primary/30 bg-primary/5"
                          : "border-muted bg-muted/20"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${
                            d.designation === "esas_scholar"
                              ? "bg-amber-500/10 text-amber-500"
                              : d.designation === "officer"
                                ? "bg-blue-500/10 text-blue-500"
                                : d.designation === "administrator"
                                  ? "bg-red-500/10 text-red-500"
                                  : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {d.designation === "officer" ? (
                            <Shield className="h-4 w-4" />
                          ) : d.designation === "esas_scholar" ? (
                            <GraduationCap className="h-4 w-4" />
                          ) : d.designation === "administrator" ? (
                            <Crown className="h-4 w-4" />
                          ) : (
                            <Award className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm capitalize">
                              {d.designation === "esas_scholar"
                                ? "ESAS Scholar"
                                : d.designation === "officer"
                                  ? d.position || "Officer"
                                  : d.designation.charAt(0).toUpperCase() +
                                    d.designation.slice(1)}
                            </span>
                            {d.is_current && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0"
                              >
                                Current
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            AY {d.academic_year}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => {
                            setEditingDesignation(d);
                            setDesigType(d.designation as DesignationType);
                            setDesigPosition(d.position || "");
                            setDesigAcademicYear(d.academic_year);
                            setDesigIsCurrent(d.is_current);
                          }}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteDesignation(d.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
