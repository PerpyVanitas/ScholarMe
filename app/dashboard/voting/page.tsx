"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
import {
  Loader2,
  Vote,
  Clock,
  Plus,
  History,
  Pencil,
  Trash2,
  EyeOff,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import type { Poll, PollOption } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import dynamic from "next/dynamic";

const CreatePollForm = dynamic(
  () =>
    import("./components/create-poll-form").then((mod) => mod.CreatePollForm),
  { ssr: false },
);

const EditPollDialog = dynamic(
  () =>
    import("./components/edit-poll-dialog").then((mod) => mod.EditPollDialog),
  { ssr: false },
);

const PollResultsDialog = dynamic(
  () =>
    import("./components/poll-results-dialog").then(
      (mod) => mod.PollResultsDialog,
    ),
  { ssr: false },
);

interface PollWithResults extends Poll {
  poll_options: (PollOption & { vote_count: number; percentage: number })[];
}

interface PollResultsData {
  poll: PollWithResults;
  totalVotes: number;
  userVotes: string[];
  hasVoted: boolean;
}

import { isPollActive, formatEndDate } from "./utils";

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
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editPoll, setEditPoll] = useState<Poll | null>(null);
  const realtimeChannelRef = useRef<ReturnType<
    ReturnType<typeof createClient>["channel"]
  > | null>(null);

  const isAdmin = role === "administrator" || role === "super_admin";
  const isSuperAdmin = role === "super_admin";

  const loadPollResults = useCallback(
    async (pollId: string, silent = false) => {
      if (!silent) {
        setLoadingResults(true);
        setShowDetailDialog(true);
      }
      try {
        const res = await fetch(`/api/v1/polls/${pollId}/results`);
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
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadPolls(controller.signal);
    return () => {
      controller.abort();
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
          loadPollResults(selectedPoll.poll.id, true);
        },
      )
      .subscribe();

    realtimeChannelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      realtimeChannelRef.current = null;
    };
  }, [showDetailDialog, selectedPoll?.poll.id, loadPollResults]);

  async function loadPolls(signal?: AbortSignal) {
    setLoading(true);
    try {
      const [activeRes, closedRes] = await Promise.all([
        fetch("/api/v1/polls?status=active", { signal }),
        fetch("/api/v1/polls?status=closed", { signal }),
      ]);
      const activeData = await activeRes.json();
      const closedData = await closedRes.json();

      if (activeData.success) setActivePolls(activeData.data || []);
      if (closedData.success) setClosedPolls(closedData.data || []);
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") return;
      toast.error("Failed to load polls");
    } finally {
      setLoading(false);
    }
  }

  async function handleVote() {
    if (!selectedPoll || !selectedOption) return;
    setVoting(true);
    try {
      const res = await fetch(`/api/v1/polls/${selectedPoll.poll.id}/vote`, {
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
    setSelectedPoll((prev) =>
      prev ? { ...prev, hasVoted: false, userVotes: [] } : prev,
    );
    setSelectedOption("");
    toast.info("Select a new option and submit to change your vote.");
  }

  async function handleEditPoll(
    pollId: string,
    updates: {
      title: string;
      description: string;
      end_date: string;
      is_hidden?: boolean;
    },
  ) {
    try {
      const res = await fetch(`/api/v1/polls/${pollId}`, {
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

  async function handleDeletePoll(pollId: string) {
    try {
      const res = await fetch(`/api/v1/polls/${pollId}`, { method: "DELETE" });
      if (res.status === 204) {
        toast.success("Poll deleted successfully!");
        loadPolls();
        setShowDetailDialog(false);
      } else {
        const data = await res.json();
        toast.error(data.error?.message || "Failed to delete poll");
      }
    } catch {
      toast.error("Failed to delete poll");
    }
  }

  async function handleToggleVisibility(poll: Poll) {
    const newHidden = !poll.is_hidden;
    try {
      const res = await fetch(`/api/v1/polls/${poll.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: poll.title,
          description: poll.description || "",
          end_date: poll.end_date,
          is_hidden: newHidden,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(
          newHidden
            ? "Poll hidden from members."
            : "Poll is now visible to members.",
        );
        loadPolls();
      } else {
        toast.error(data.error?.message || "Failed to update visibility");
      }
    } catch {
      toast.error("Failed to update visibility");
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
              {activePolls.map((poll) => {
                const pollIsActive = isPollActive(poll);
                return (
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
                        {isAdmin && pollIsActive && (
                          <div
                            className="flex items-center gap-1 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Edit */}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              title="Edit poll"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditPoll(poll);
                                setShowEditDialog(true);
                              }}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            {/* Delete */}
                            <ConfirmDeleteButton
                              pollTitle={poll.title}
                              onConfirm={() => handleDeletePoll(poll.id)}
                            />
                          </div>
                        )}
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
                );
              })}
            </div>
          )}
        </div>

        {/* Poll History Button */}
        <div className="pt-6 border-t border-border/40 flex justify-center">
          <Button
            variant="outline"
            onClick={() => setShowHistoryModal(true)}
            className="gap-2"
          >
            <History className="h-4 w-4" />
            View Poll History
          </Button>
        </div>

        {/* Poll History Modal */}
        <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
          <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-muted-foreground" />
                Poll History
              </DialogTitle>
              <DialogDescription>
                View past polls and their results.
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto pr-2">
              {closedPolls.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground text-sm">
                  No historical polls found
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {closedPolls.map((poll) => (
                    <div
                      key={poll.id}
                      onClick={() => {
                        setShowHistoryModal(false);
                        loadPollResults(poll.id);
                      }}
                      className="flex items-center justify-between py-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex flex-col gap-0.5 min-w-0 flex-1 px-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground text-sm sm:text-base truncate">
                            {poll.title}
                          </span>
                          {isAdmin && poll.is_hidden && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 shrink-0 border-amber-500/40 text-amber-600 bg-amber-500/10"
                            >
                              <EyeOff className="h-2.5 w-2.5 mr-1" />
                              Hidden
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground truncate">
                          {poll.description || "No description provided"}
                        </span>
                      </div>
                      <div
                        className="flex items-center gap-2 shrink-0 ml-4 px-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          Ended {new Date(poll.end_date).toLocaleDateString()}
                        </span>
                        {isAdmin && (
                          <>
                            {isSuperAdmin && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                title="Edit poll (super admin)"
                                onClick={() => {
                                  setShowHistoryModal(false);
                                  setEditPoll(poll);
                                  setShowEditDialog(true);
                                }}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            )}
                            {isSuperAdmin && (
                              <ConfirmDeleteButton
                                pollTitle={poll.title}
                                onConfirm={() => {
                                  setShowHistoryModal(false);
                                  handleDeletePoll(poll.id);
                                }}
                              />
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              title={
                                poll.is_hidden
                                  ? "Unhide poll (make visible to members)"
                                  : "Hide poll from members"
                              }
                              onClick={() => handleToggleVisibility(poll)}
                            >
                              {poll.is_hidden ? (
                                <Eye className="h-3 w-3" />
                              ) : (
                                <EyeOff className="h-3 w-3" />
                              )}
                            </Button>
                          </>
                        )}
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
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Poll Details Dialog */}
      <PollResultsDialog
        showDetailDialog={showDetailDialog}
        setShowDetailDialog={setShowDetailDialog}
        loadingResults={loadingResults}
        selectedPoll={selectedPoll}
        isAdmin={isAdmin}
        selectedOption={selectedOption}
        setSelectedOption={setSelectedOption}
        handleChangeVote={handleChangeVote}
        handleVote={handleVote}
        voting={voting}
      />

      {/* Edit Poll Dialog (admin only) */}
      {editPoll && (
        <EditPollDialog
          poll={editPoll}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSave={handleEditPoll}
          canEdit={isPollActive(editPoll) || isSuperAdmin}
          isSuperAdmin={isSuperAdmin}
        />
      )}
    </div>
  );
}

// ─── Confirm Delete Button ────────────────────────────────────────────────────
function ConfirmDeleteButton({
  pollTitle,
  onConfirm,
}: {
  pollTitle: string;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          title="Delete poll"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Poll</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-medium">&quot;{pollTitle}&quot;</span>? This
            will permanently remove the poll and all votes. This action cannot
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
