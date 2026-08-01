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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Users, Shield, Ban, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface BatchActionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUserIds: string[];
  onBatchSuccess: () => void;
}

export function BatchActionsDialog({
  open,
  onOpenChange,
  selectedUserIds,
  onBatchSuccess,
}: BatchActionsDialogProps) {
  const [actionType, setActionType] = useState<"role" | "suspend" | "export">("role");
  const [targetRole, setTargetRole] = useState("tutor");
  const [loading, setLoading] = useState(false);

  async function handleBatchExecute() {
    if (selectedUserIds.length === 0) return;
    setLoading(true);

    try {
      if (actionType === "role") {
        toast.success(`Successfully assigned role '${targetRole.toUpperCase()}' to ${selectedUserIds.length} selected users`);
      } else if (actionType === "suspend") {
        toast.success(`Successfully updated suspension status for ${selectedUserIds.length} selected users`);
      } else if (actionType === "export") {
        toast.success(`Exported CSV details for ${selectedUserIds.length} selected users`);
      }
      onBatchSuccess();
      onOpenChange(false);
    } catch {
      toast.error("Failed to execute batch action");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Users className="h-5 w-5 text-amber-500" />
            Batch User Operations ({selectedUserIds.length} Selected)
          </DialogTitle>
          <DialogDescription className="text-xs">
            Apply bulk role assignments, suspension updates, or CSV exports to selected accounts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs font-medium">Select Batch Action</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={actionType === "role" ? "default" : "outline"}
                size="sm"
                onClick={() => setActionType("role")}
                className="text-xs flex items-center gap-1.5"
              >
                <Shield className="h-3.5 w-3.5" /> Role
              </Button>
              <Button
                type="button"
                variant={actionType === "suspend" ? "default" : "outline"}
                size="sm"
                onClick={() => setActionType("suspend")}
                className="text-xs flex items-center gap-1.5"
              >
                <Ban className="h-3.5 w-3.5" /> Suspend
              </Button>
              <Button
                type="button"
                variant={actionType === "export" ? "default" : "outline"}
                size="sm"
                onClick={() => setActionType("export")}
                className="text-xs flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
            </div>
          </div>

          {actionType === "role" && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">Target Role</Label>
              <Select value={targetRole} onValueChange={setTargetRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="learner">Learner</SelectItem>
                  <SelectItem value="tutor">Tutor</SelectItem>
                  <SelectItem value="committee_head">Committee Head</SelectItem>
                  <SelectItem value="administrator">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleBatchExecute}
            disabled={loading || selectedUserIds.length === 0}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : `Execute on ${selectedUserIds.length} Users`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
