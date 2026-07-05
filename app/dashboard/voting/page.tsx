"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@/lib/user-context";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  Vote,
  CheckCircle2,
  Clock,
  Plus,
  BarChart3,
  History,
  Pencil,
  X,
  GripVertical,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import type { Poll, PollOption } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

interface PollWithResults extends Poll {
  poll_options: (PollOption & { vote_count: number; percentage: number })[];
}

interface PollResultsData {
  poll: PollWithResults;
  totalVotes: number;
  userVotes: string[];
  hasVoted: boolean;
}

// Utility: format timezone-aware date string
function formatEndDate(dateStr: string) {
  const d = new Date(dateStr);
  const localStr = format(d, "MMM d, yyyy 'at' h:mm a");
  // Show offset
  const offset = -d.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const absOffset = Math.abs(offset);
  const tzLabel = `UTC${sign}${Math.floor(absOffset / 60)}${absOffset % 60 !== 0 ? `:${absOffset % 60}` : ""}`;
  return `${localStr} (${tzLabel})`;
}

export default function VotingPage() {
  const { role } = useUser();
  const [activePolls, setActivePolls] = useState<Poll[]>([]);
  const [closedPolls, setClosedPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPoll, setSelectedPoll] = useState<PollResultsData | null>(
    null,
  );
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [voting, setVoting] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editPoll, setEditPoll] = useState<Poll | null>(null);
  const realtimeChannelRef = useRef<ReturnType<
    ReturnType<typeof createClient>["channel"]
  > | null>(null);

  const isAdmin = role === "administrator" || role === "super_admin";

  useEffect(() => {
    loadPolls();
    return () => {
      if (realtimeChannelRef.current) {
        createClient().removeChannel(realtimeChannelRef.current);
      }
    };
  }, []);

  // Subscribe to realtime vote updates when detail dialog is open
  useEffect(() => {
    if (!showDetailDialog || !selectedPoll) {
      if (realtimeChannelRef.current) {
        createClient().removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
      return;
    }

    const supabase = createClient();
    const channel = supabase
      .channel(`poll_votes_${selectedPoll.poll.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_votes",
          filter: `poll_id=eq.${selectedPoll.poll.id}`,
        },
        () => {
          // Refresh results silently on new vote
          loadPollResults(selectedPoll.poll.id, true);
        },
      )
      .subscribe();

    realtimeChannelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      realtimeChannelRef.current = null;
    };
  }, [showDetailDialog, selectedPoll?.poll.id]);

  async function loadPolls() {
    setLoading(true);
    try {
      const [activeRes, closedRes] = await Promise.all([
        fetch("/api/polls?status=active"),
        fetch("/api/polls?status=closed"),
      ]);
      const activeData = await activeRes.json();
      const closedData = await closedRes.json();

      if (activeData.success) setActivePolls(activeData.data || []);
      if (closedData.success) setClosedPolls(closedData.data || []);
    } catch {
      toast.error("Failed to load polls");
    } finally {
      setLoading(false);
    }
  }

  async function loadPollResults(pollId: string, silent = false) {
    if (!silent) {
      setLoadingResults(true);
      setShowDetailDialog(true);
    }
    try {
      const res = await fetch(`/api/polls/${pollId}/results`);
      const data = await res.json();
      if (data.success) {
        setSelectedPoll(data.data);
        if (!silent) setSelectedOption("");
      }
    } catch {
      if (!silent) {
        toast.error("Failed to load poll results");
        setShowDetailDialog(false);
      }
    } finally {
      if (!silent) setLoadingResults(false);
    }
  }

  async function handleVote() {
    if (!selectedPoll || !selectedOption) return;
    setVoting(true);
    try {
      const res = await fetch(`/api/polls/${selectedPoll.poll.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ option_id: selectedOption }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Vote recorded successfully!");
        loadPollResults(selectedPoll.poll.id);
        loadPolls();
      } else {
        toast.error(data.error?.message || "Failed to vote");
      }
    } catch {
      toast.error("Failed to submit vote");
    } finally {
      setVoting(false);
    }
  }

  async function handleChangeVote() {
    if (!selectedPoll) return;
    // Reset the hasVoted state locally to allow re-voting UI
    setSelectedPoll((prev) =>
      prev ? { ...prev, hasVoted: false, userVotes: [] } : prev,
    );
    setSelectedOption("");
    toast.info("Select a new option and submit to change your vote.");
  }

  async function handleEditPoll(
    pollId: string,
    updates: { title: string; description: string; end_date: string },
  ) {
    try {
      const res = await fetch(`/api/polls/${pollId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Poll updated successfully!");
        setShowEditDialog(false);
        loadPolls();
        if (selectedPoll?.poll.id === pollId) {
          loadPollResults(pollId, true);
        }
      } else {
        toast.error(data.error?.message || "Failed to update poll");
      }
    } catch {
      toast.error("Failed to update poll");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Organization Voting
          </h1>
          <p className="text-sm text-muted-foreground">
            Participate in organization polls and see results
          </p>
        </div>
        {isAdmin && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Poll
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Poll</DialogTitle>
                <DialogDescription>
                  Create a poll for organization members to vote on
                </DialogDescription>
              </DialogHeader>
              <CreatePollForm
                onSuccess={() => {
                  setShowCreateDialog(false);
                  loadPolls();
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-6">
        {/* Active Polls */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Active Polls</h2>
          {activePolls.length === 0 ? (
            <Card className="border-border/60">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Vote className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  No active polls at the moment
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {activePolls.map((poll) => (
                <Card
                  key={poll.id}
                  className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md flex flex-col justify-between"
                  onClick={() => loadPollResults(poll.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base flex-1 line-clamp-2">
                        {poll.title}
                      </CardTitle>
                      <div className="flex items-center gap-1 shrink-0">
                        {isAdmin && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditPoll(poll);
                              setShowEditDialog(true);
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {poll.description && (
                      <CardDescription className="line-clamp-2 mt-1">
                        {poll.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        Closes{" "}
                        {formatDistanceToNow(new Date(poll.end_date), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground italic">
                      {formatEndDate(poll.end_date)}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {poll.poll_options?.length || 0} options
                      </span>
                      {poll.allow_multiple_votes && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0"
                        >
                          Multiple
                        </Badge>
                      )}
                      {poll.is_anonymous && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0"
                        >
                          Anonymous
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Poll History */}
        <div className="space-y-4 pt-6 border-t border-border/40">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-medium">Poll History</h2>
          </div>
          {closedPolls.length === 0 ? (
            <Card className="border-border/60">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground text-sm">
                No historical polls found
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/60">
              <CardContent className="p-0">
                <div className="divide-y divide-border/60">
                  {closedPolls.map((poll) => (
                    <div
                      key={poll.id}
                      onClick={() => loadPollResults(poll.id)}
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                        <span className="font-medium text-foreground text-sm sm:text-base truncate">
                          {poll.title}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {poll.description || "No description provided"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          Ended {new Date(poll.end_date).toLocaleDateString()}
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-xs font-normal"
                        >
                          Closed
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Poll Details Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogTitle className="sr-only">
            {selectedPoll?.poll?.title || "Poll Details"}
          </DialogTitle>
          {loadingResults ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : selectedPoll ? (
            <>
              <DialogHeader>
                <h2 className="text-lg font-semibold text-foreground">
                  {selectedPoll.poll.title}
                </h2>
                {selectedPoll.poll.description && (
                  <DialogDescription className="text-sm mt-1">
                    {selectedPoll.poll.description}
                  </DialogDescription>
                )}
                {/* Timezone-aware end date */}
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedPoll.poll.status === "active"
                    ? `Closes: ${formatEndDate(selectedPoll.poll.end_date)}`
                    : `Ended: ${formatEndDate(selectedPoll.poll.end_date)}`}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <Badge variant="outline">
                    <BarChart3 className="h-3 w-3 mr-1" />
                    {selectedPoll.totalVotes} vote
                    {selectedPoll.totalVotes !== 1 ? "s" : ""}
                  </Badge>
                  {selectedPoll.hasVoted && (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      You voted
                    </Badge>
                  )}
                  {selectedPoll.poll.status === "closed" && (
                    <Badge variant="destructive">Closed</Badge>
                  )}
                  {/* Live update indicator */}
                  {selectedPoll.poll.status === "active" && (
                    <Badge
                      variant="outline"
                      className="text-[10px] border-green-500/30 text-green-600 bg-green-500/10"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1 animate-pulse inline-block" />
                      Live
                    </Badge>
                  )}
                </div>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {selectedPoll.hasVoted ||
                selectedPoll.poll.status === "closed" ? (
                  <div className="space-y-3">
                    {selectedPoll.poll.poll_options
                      .sort((a, b) => a.display_order - b.display_order)
                      .map((option) => (
                        <div key={option.id} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span
                              className={
                                selectedPoll.userVotes.includes(option.id)
                                  ? "font-medium"
                                  : ""
                              }
                            >
                              {option.option_text}
                              {selectedPoll.userVotes.includes(option.id) && (
                                <CheckCircle2 className="h-3 w-3 inline ml-1 text-green-600" />
                              )}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              {option.vote_count} ({option.percentage}%)
                            </span>
                          </div>
                          <Progress value={option.percentage} className="h-2" />
                        </div>
                      ))}
                  </div>
                ) : (
                  <RadioGroup
                    value={selectedOption}
                    onValueChange={setSelectedOption}
                  >
                    {selectedPoll.poll.poll_options
                      .sort((a, b) => a.display_order - b.display_order)
                      .map((option) => (
                        <div
                          key={option.id}
                          className="flex items-center space-x-2 py-2 px-3 rounded-md hover:bg-muted/50 transition-colors"
                        >
                          <RadioGroupItem
                            value={option.id}
                            id={`opt-${option.id}`}
                          />
                          <Label
                            htmlFor={`opt-${option.id}`}
                            className="flex-1 cursor-pointer text-sm"
                          >
                            {option.option_text}
                          </Label>
                        </div>
                      ))}
                  </RadioGroup>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-0 flex-wrap">
                {/* Change Vote — active poll, already voted */}
                {selectedPoll.hasVoted &&
                  selectedPoll.poll.status === "active" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleChangeVote}
                      className="w-full sm:w-auto"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Change Vote
                    </Button>
                  )}
                {/* Submit Vote */}
                {!selectedPoll.hasVoted &&
                  selectedPoll.poll.status === "active" && (
                    <Button
                      onClick={handleVote}
                      disabled={!selectedOption || voting}
                      className="w-full sm:w-auto"
                    >
                      {voting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Vote className="h-4 w-4 mr-2" />
                          Submit Vote
                        </>
                      )}
                    </Button>
                  )}
                <Button
                  variant="outline"
                  onClick={() => setShowDetailDialog(false)}
                  className="w-full sm:w-auto"
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Edit Poll Dialog (admin only) */}
      {editPoll && (
        <EditPollDialog
          poll={editPoll}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSave={handleEditPoll}
        />
      )}
    </div>
  );
}

// ─── Create Poll Form ─────────────────────────────────────────────────────────
function CreatePollForm({ onSuccess }: { onSuccess: () => void }) {
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

// ─── Edit Poll Dialog (admin only) ────────────────────────────────────────────
function EditPollDialog({
  poll,
  open,
  onOpenChange,
  onSave,
}: {
  poll: Poll;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (
    id: string,
    updates: { title: string; description: string; end_date: string },
  ) => Promise<void>;
}) {
  const [title, setTitle] = useState(poll.title);
  const [description, setDescription] = useState(poll.description || "");
  const [endDate, setEndDate] = useState(
    poll.end_date ? new Date(poll.end_date).toISOString().slice(0, 16) : "",
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(poll.title);
    setDescription(poll.description || "");
    setEndDate(
      poll.end_date ? new Date(poll.end_date).toISOString().slice(0, 16) : "",
    );
  }, [poll]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
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
          <DialogTitle>Edit Poll</DialogTitle>
          <DialogDescription>
            Update the poll title, description, or end date. Options cannot be
            changed after creation.
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
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
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
            />
            {endDate && (
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
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
