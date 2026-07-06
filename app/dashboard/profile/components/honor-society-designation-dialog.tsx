"use client";

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
import { Loader2 } from "lucide-react";
import type { HsDesignation, DesignationType } from "@/lib/types";

interface HonorSocietyDesignationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingDesignation: HsDesignation | null;
  desigType: DesignationType;
  setDesigType: (v: DesignationType) => void;
  desigPosition: string;
  setDesigPosition: (v: string) => void;
  desigAcademicYear: string;
  setDesigAcademicYear: (v: string) => void;
  desigIsCurrent: boolean;
  setDesigIsCurrent: (v: boolean) => void;
  savingDesignation: boolean;
  roleName: string;
  handleSaveDesignation: () => void;
}

export function HonorSocietyDesignationDialog({
  open,
  onOpenChange,
  editingDesignation,
  desigType,
  setDesigType,
  desigPosition,
  setDesigPosition,
  desigAcademicYear,
  setDesigAcademicYear,
  desigIsCurrent,
  setDesigIsCurrent,
  savingDesignation,
  roleName,
  handleSaveDesignation,
}: HonorSocietyDesignationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {editingDesignation ? "Edit Designation" : "Add Designation"}
          </DialogTitle>
          <DialogDescription>
            {editingDesignation
              ? "Update your Honor Society designation."
              : "Add a designation or role you held."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
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
                {roleName === "super_admin" && (
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
              This is my current designation
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={
              savingDesignation || (desigType === "officer" && !desigPosition)
            }
            onClick={handleSaveDesignation}
          >
            {savingDesignation ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
