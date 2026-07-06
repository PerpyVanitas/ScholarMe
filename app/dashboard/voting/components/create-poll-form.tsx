"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, X, GripVertical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { formatEndDate } from "../utils";

export function CreatePollForm({ onSuccess }: { onSuccess: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [endDate, setEndDate] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [creating, setCreating] = useState(false);

  function addOption() {
    setOptions((prev) => [...prev, ""]);
  }

  function removeOption(idx: number) {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateOption(idx: number, value: string) {
    setOptions((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const validOptions = options.map((o) => o.trim()).filter(Boolean);
    if (validOptions.length < 2) {
      toast.error("At least 2 options are required");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          end_date: new Date(endDate).toISOString(),
          options: validOptions,
          allow_multiple_votes: allowMultiple,
          is_anonymous: isAnonymous,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Poll created successfully!");
        onSuccess();
      } else {
        toast.error(data.error?.message || "Failed to create poll");
      }
    } catch {
      toast.error("Failed to create poll");
    } finally {
      setCreating(false);
    }
  }

  return (
    <form onSubmit={handleCreate} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="poll-title">Title *</Label>
        <Input
          id="poll-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What should we decide?"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="poll-description">Description (optional)</Label>
        <Textarea
          id="poll-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Provide more context..."
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="poll-end-date">End Date *</Label>
        <Input
          id="poll-end-date"
          type="datetime-local"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          required
        />
        {endDate && (
          <p className="text-xs text-muted-foreground">
            Closes: {formatEndDate(endDate)}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Options *</Label>
        <div className="space-y-2">
          {options.map((opt, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              <Input
                value={opt}
                onChange={(e) => updateOption(idx, e.target.value)}
                placeholder={`Option ${idx + 1}`}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeOption(idx)}
                disabled={options.length <= 2}
                title={
                  options.length <= 2
                    ? "Minimum 2 options required"
                    : "Remove option"
                }
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addOption}>
          <Plus className="h-4 w-4 mr-2" />
          Add Option
        </Button>
      </div>

      <div className="space-y-3 pt-1">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="allowMultiple"
            checked={allowMultiple}
            onCheckedChange={(c) => setAllowMultiple(c === true)}
          />
          <Label htmlFor="allowMultiple">Allow multiple votes per user</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="isAnonymous"
            checked={isAnonymous}
            onCheckedChange={(c) => setIsAnonymous(c === true)}
          />
          <Label htmlFor="isAnonymous">Anonymous voting</Label>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={creating}>
        {creating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Creating...
          </>
        ) : (
          "Create Poll"
        )}
      </Button>
    </form>
  );
}
