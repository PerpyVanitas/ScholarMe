"use client";

import {
  Loader2,
  BarChart3,
  CheckCircle2,
  EyeOff,
  Vote,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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

export interface PollOptionDetail {
  id: string;
  option_text: string;
  vote_count?: number;
}

export interface PollDetailData {
  poll: Partial<Poll> & {
    id: string;
    title: string;
    end_date: string;
    poll_options?: PollOptionDetail[];
  };
  totalVotes: number;
  hasVoted: boolean;
  userVotedOptionId?: string;
  results?: {
    option_id: string;
    option_text: string;
    count: number;
    percentage: number;
    voters?: { id: string; full_name?: string }[];
  }[];
}

interface PollResultsDialogProps {
  showDetailDialog: boolean;
  setShowDetailDialog: (v: boolean) => void;
  loadingResults: boolean;
  selectedPoll: PollDetailData | null;
  isAdmin: boolean;
  selectedOption: string;
  setSelectedOption: (v: string) => void;
  handleChangeVote: () => void;
  handleVote: () => void;
  voting: boolean;
}

export function PollResultsDialog({
  showDetailDialog,
  setShowDetailDialog,
  loadingResults,
  selectedPoll,
  isAdmin,
  selectedOption,
  setSelectedOption,
  handleChangeVote,
  handleVote,
  voting,
}: PollResultsDialogProps) {
  const active = selectedPoll ? isPollActive(selectedPoll.poll) : false;

  return (
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
              <p className="text-xs text-muted-foreground mt-1">
                {active
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
                {selectedPoll.poll.is_anonymous && (
                  <Badge variant="secondary">
                    <EyeOff className="h-3 w-3 mr-1" />
                    Anonymous Poll
                  </Badge>
                )}
              </div>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Show Breakdown when voted or ended */}
              {selectedPoll.hasVoted || !active ? (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Current Results
                  </h3>
                  {selectedPoll.results?.map((res) => (
                    <div key={res.option_id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="flex items-center gap-1.5">
                          {res.option_text}
                          {res.option_id === selectedPoll.userVotedOptionId && (
                            <Badge variant="outline" className="text-[10px] py-0">Your vote</Badge>
                          )}
                        </span>
                        <span>{res.percentage}% ({res.count})</span>
                      </div>
                      <Progress value={res.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              ) : (
                /* Radio selection for active unvoted poll */
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Select an Option
                  </h3>
                  <RadioGroup
                    value={selectedOption}
                    onValueChange={setSelectedOption}
                    className="space-y-2"
                  >
                    {selectedPoll.poll.poll_options?.map((opt) => (
                      <div
                        key={opt.id}
                        className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-muted/40 cursor-pointer"
                      >
                        <RadioGroupItem value={opt.id} id={opt.id} />
                        <Label htmlFor={opt.id} className="cursor-pointer text-sm font-medium flex-1">
                          {opt.option_text}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
              {selectedPoll.hasVoted && active && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleChangeVote}
                  className="w-full sm:w-auto text-xs gap-1"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Change Vote
                </Button>
              )}
              {!selectedPoll.hasVoted && active && (
                <Button
                  size="sm"
                  onClick={handleVote}
                  disabled={!selectedOption || voting}
                  className="w-full sm:w-auto text-xs gap-1"
                >
                  {voting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <Vote className="h-3.5 w-3.5" /> Cast Vote
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetailDialog(false)}
                className="w-full sm:w-auto text-xs"
              >
                Close
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
