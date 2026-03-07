"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/lib/user-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, Vote, CheckCircle2, Clock, Plus, BarChart3 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

interface PollWithResults extends Poll {
  poll_options: (PollOption & { vote_count: number; percentage: number })[];
}

interface PollResultsData {
  poll: PollWithResults;
  totalVotes: number;
  userVotes: string[];
  hasVoted: boolean;
}

export default function VotingPage() {
  const { role } = useUser();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPoll, setSelectedPoll] = useState<PollResultsData | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [voting, setVoting] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const isAdmin = role === "administrator";

  useEffect(() => {
    loadPolls();
  }, []);

  async function loadPolls() {
    setLoading(true);
    try {
      const res = await fetch("/api/polls?status=active");
      const data = await res.json();
      if (data.success) {
        setPolls(data.data.polls || []);
      }
    } catch {
      toast.error("Failed to load polls");
    } finally {
      setLoading(false);
    }
  }

  async function loadPollResults(pollId: string) {
    setLoadingResults(true);
    try {
      const res = await fetch(`/api/polls/${pollId}/results`);
      const data = await res.json();
      if (data.success) {
        setSelectedPoll(data.data);
        setSelectedOption("");
      }
    } catch {
      toast.error("Failed to load poll results");
    } finally {
      setLoadingResults(false);
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
      } else {
        toast.error(data.error?.message || "Failed to vote");
      }
    } catch {
      toast.error("Failed to submit vote");
    } finally {
      setVoting(false);
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
          <h1 className="text-2xl font-semibold tracking-tight">Organization Voting</h1>
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
              <CreatePollForm onSuccess={() => { setShowCreateDialog(false); loadPolls(); }} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Polls List */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Active Polls</h2>
          {polls.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Vote className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No active polls at the moment</p>
              </CardContent>
            </Card>
          ) : (
            polls.map((poll) => (
              <Card
                key={poll.id}
                className={`cursor-pointer transition-colors hover:border-primary/50 ${
                  selectedPoll?.poll.id === poll.id ? "border-primary" : ""
                }`}
                onClick={() => loadPollResults(poll.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{poll.title}</CardTitle>
                    <Badge variant="secondary" className="ml-2">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDistanceToNow(new Date(poll.end_date), { addSuffix: true })}
                    </Badge>
                  </div>
                  {poll.description && (
                    <CardDescription>{poll.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{poll.poll_options?.length || 0} options</span>
                    {poll.allow_multiple_votes && (
                      <Badge variant="outline" className="text-xs">Multiple votes</Badge>
                    )}
                    {poll.is_anonymous && (
                      <Badge variant="outline" className="text-xs">Anonymous</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Poll Details & Voting */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium">
            {selectedPoll ? "Cast Your Vote" : "Select a Poll"}
          </h2>
          
          {loadingResults ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : selectedPoll ? (
            <Card>
              <CardHeader>
                <CardTitle>{selectedPoll.poll.title}</CardTitle>
                {selectedPoll.poll.description && (
                  <CardDescription>{selectedPoll.poll.description}</CardDescription>
                )}
                <div className="flex items-center gap-2 pt-2">
                  <Badge variant="outline">
                    <BarChart3 className="h-3 w-3 mr-1" />
                    {selectedPoll.totalVotes} vote{selectedPoll.totalVotes !== 1 ? "s" : ""}
                  </Badge>
                  {selectedPoll.hasVoted && (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      You voted
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedPoll.hasVoted || selectedPoll.poll.status === "closed" ? (
                  // Show results
                  <div className="space-y-3">
                    {selectedPoll.poll.poll_options
                      .sort((a, b) => a.display_order - b.display_order)
                      .map((option) => (
                        <div key={option.id} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className={selectedPoll.userVotes.includes(option.id) ? "font-medium" : ""}>
                              {option.option_text}
                              {selectedPoll.userVotes.includes(option.id) && (
                                <CheckCircle2 className="h-3 w-3 inline ml-1 text-green-600" />
                              )}
                            </span>
                            <span className="text-muted-foreground">
                              {option.vote_count} ({option.percentage}%)
                            </span>
                          </div>
                          <Progress value={option.percentage} className="h-2" />
                        </div>
                      ))}
                  </div>
                ) : (
                  // Show voting form
                  <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
                    {selectedPoll.poll.poll_options
                      .sort((a, b) => a.display_order - b.display_order)
                      .map((option) => (
                        <div key={option.id} className="flex items-center space-x-2 py-2">
                          <RadioGroupItem value={option.id} id={option.id} />
                          <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                            {option.option_text}
                          </Label>
                        </div>
                      ))}
                  </RadioGroup>
                )}

                {!selectedPoll.hasVoted && selectedPoll.poll.status === "active" && (
                  <Button
                    onClick={handleVote}
                    disabled={!selectedOption || voting}
                    className="w-full"
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
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Select a poll to view details and vote</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function CreatePollForm({ onSuccess }: { onSuccess: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [endDate, setEndDate] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    
    const validOptions = options.filter((o) => o.trim());
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
          title,
          description: description || null,
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
    <>
      <DialogHeader>
        <DialogTitle>Create New Poll</DialogTitle>
        <DialogDescription>
          Create a poll for organization members to vote on
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleCreate} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What should we decide?"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide more context..."
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Options</Label>
          {options.map((opt, idx) => (
            <div key={idx} className="flex gap-2">
              <Input
                value={opt}
                onChange={(e) => {
                  const newOpts = [...options];
                  newOpts[idx] = e.target.value;
                  setOptions(newOpts);
                }}
                placeholder={`Option ${idx + 1}`}
              />
              {options.length > 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setOptions(options.filter((_, i) => i !== idx))}
                >
                  &times;
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOptions([...options, ""])}
          >
            Add Option
          </Button>
        </div>

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
    </>
  );
}
