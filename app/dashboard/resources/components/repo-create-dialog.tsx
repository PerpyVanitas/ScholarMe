"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

import { RepoRow } from "../types";

interface RepoCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSuccess: (newRepo: RepoRow) => void;
}

export function RepoCreateDialog({
  open,
  onOpenChange,
  userId,
  onSuccess,
}: RepoCreateDialogProps) {
  const [repoTitle, setRepoTitle] = useState("");
  const [repoDesc, setRepoDesc] = useState("");
  const [repoAccess, setRepoAccess] = useState("all");
  const [repoSaving, setRepoSaving] = useState(false);

  async function handleCreateRepo() {
    if (!repoTitle.trim()) {
      toast.error("Repository title is required.");
      return;
    }
    setRepoSaving(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("repositories")
        .insert({
          owner_id: userId,
          title: repoTitle.trim(),
          description: repoDesc.trim() || null,
          access_role: repoAccess,
        })
        .select(
          "id, owner_id, title, description, access_role, created_at, profiles!repositories_owner_id_fkey(full_name)",
        )
        .single();
      if (error) throw error;

      setRepoTitle("");
      setRepoDesc("");
      setRepoAccess("all");
      onSuccess(data);
      toast.success("Repository created!");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create repository",
      );
    } finally {
      setRepoSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Repository</DialogTitle>
          <DialogDescription>
            Organize resources into a collection. Control who can view the
            contents.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="repo-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="repo-title"
              value={repoTitle}
              onChange={(e) => setRepoTitle(e.target.value)}
              placeholder="e.g., Math 101 Materials"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="repo-desc">Description</Label>
            <Textarea
              id="repo-desc"
              value={repoDesc}
              onChange={(e) => setRepoDesc(e.target.value)}
              placeholder="Brief description..."
              rows={2}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Access</Label>
            <Select value={repoAccess} onValueChange={setRepoAccess}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Everyone</SelectItem>
                <SelectItem value="tutor">Tutors & Admins only</SelectItem>
                <SelectItem value="admin">Admins only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateRepo} disabled={repoSaving}>
            {repoSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
