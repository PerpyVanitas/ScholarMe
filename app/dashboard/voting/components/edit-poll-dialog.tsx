"use client";

import { useState, useEffect } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Poll } from "@/lib/types";
import { formatEndDate, isPollActive } from "../utils";

export function EditPollDialog({
  poll,
  open,
  onOpenChange,
  onSave,
  canEdit,
  isSuperAdmin,
}: {
  poll: Poll;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (
    id: string,
    updates: {
      title: string;
      description: string;
      end_date: string;
      is_hidden?: boolean;
    },
  ) => Promise<void>;
  canEdit: boolean;
  isSuperAdmin: boolean;
}) {
  const [title, setTitle] = useState(poll.title);
  const [description, setDescription] = useState(poll.description || "");
  const [endDate, setEndDate] = useState(
    poll.end_date ? new Date(poll.end_date).toISOString().slice(0, 16) : "",
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTitle(poll.title);
    setDescription(poll.description || "");
    setEndDate(
      poll.end_date ? new Date(poll.end_date).toISOString().slice(0, 16) : "",
    );
  }, [poll]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canEdit) return;
    setSaving(true);
    await onSave(poll.id, {
      title: title.trim(),
      description: description.trim(),
      end_date: new Date(endDate).toISOString(),
    });
    setSaving(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {canEdit ? "Edit Poll" : "View Poll (Read-only)"}
            {isSuperAdmin && !isPollActive(poll) && (
              <Badge
                variant="outline"
                className="text-[10px] border-purple-500/40 text-purple-600 bg-purple-500/10"
              >
                <ShieldAlert className="h-2.5 w-2.5 mr-1" />
                Super Admin Override
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {canEdit
              ? "Update the poll title, description, or end date. Options cannot be changed after creation."
              : "This poll has ended. Only super admins can edit closed polls."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title *</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-end-date">End Date *</Label>
            <Input
              id="edit-end-date"
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              disabled={!canEdit}
            />
            {endDate && canEdit && (
              <p className="text-xs text-muted-foreground">
                Closes: {formatEndDate(endDate)}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {canEdit ? "Cancel" : "Close"}
            </Button>
            {canEdit && (
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Save Changes
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
