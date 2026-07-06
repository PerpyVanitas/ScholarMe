/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { formatEndDate, isPollActive } from "../utils";

interface PollResultsDialogProps {
  showDetailDialog: boolean;
  setShowDetailDialog: (v: boolean) => void;
  loadingResults: boolean;
  selectedPoll: any;
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
                {isPollActive(selectedPoll.poll)
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
                {!isPollActive(selectedPoll.poll) && (
                  <Badge variant="destructive">Closed</Badge>
                )}
                {isPollActive(selectedPoll.poll) && (
                  <Badge
                    variant="outline"
                    className="text-[10px] border-green-500/30 text-green-600 bg-green-500/10"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1 animate-pulse inline-block" />
                    Live
                  </Badge>
                )}
                {isAdmin && selectedPoll.poll.is_hidden && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 border-amber-500/40 text-amber-600 bg-amber-500/10"
                  >
                    <EyeOff className="h-2.5 w-2.5 mr-1" />
                    Hidden from members
                  </Badge>
                )}
              </div>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {selectedPoll.hasVoted || !isPollActive(selectedPoll.poll) ? (
                <div className="space-y-3">
                  {selectedPoll.poll.poll_options
                    .sort((a: any, b: any) => a.display_order - b.display_order)
                    .map((option: any) => (
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
                    .sort((a: any, b: any) => a.display_order - b.display_order)
                    .map((option: any) => (
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
              {selectedPoll.hasVoted && isPollActive(selectedPoll.poll) && (
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
              {!selectedPoll.hasVoted && isPollActive(selectedPoll.poll) && (
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
  );
}
