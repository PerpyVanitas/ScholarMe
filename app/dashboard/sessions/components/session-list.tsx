"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  PenTool,
  CalendarPlus,
  Sparkles,
  Video,
  RefreshCw,
  UserPlus,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { SESSION_STATUS_COLORS } from "@/lib/constants";
import type { Session, UserRole } from "@/lib/types";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { generateIcsFile, downloadIcs } from "@/lib/utils/calendar";
import { formatRelativeDate } from "@/lib/utils";

export function SessionList({
  sessions,
  role,
  onUpdateStatus,
  onRate,
  onSummary,
}: {
  sessions: Session[];
  role: UserRole;
  onUpdateStatus: (id: string, status: string, extraData?: any) => void;
  onRate: (session: Session) => void;
  onSummary: (session: Session) => void;
}) {
  const [confirmingSession, setConfirmingSession] = useState<Session | null>(
    null,
  );
  const [meetingLink, setMeetingLink] = useState("");
  const [rescheduleSession, setRescheduleSession] = useState<Session | null>(
    null,
  );
  const [newDate, setNewDate] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");

  const [transferSession, setTransferSession] = useState<Session | null>(null);
  const [availableTutors, setAvailableTutors] = useState<any[]>([]);
  const [selectedTutorId, setSelectedTutorId] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);

  const handleOpenTransfer = async (session: Session) => {
    setTransferSession(session);
    setTransferLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("tutors")
      .select("id, profiles(full_name)")
      .eq("is_available", true)
      .neq("id", session.tutor_id);
    if (data) setAvailableTutors(data);
    setTransferLoading(false);
  };

  const handleConfirmTransfer = async () => {
    if (!transferSession || !selectedTutorId) return;
    onUpdateStatus(transferSession.id, transferSession.status, {
      transfer_to_tutor_id: selectedTutorId,
    });
    setTransferSession(null);
    setSelectedTutorId("");
    toast.success("Transfer request sent to substitute tutor");
  };

  if (sessions.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="No sessions found"
        description={
          role === "learner"
            ? "Book your first tutoring session to get started."
            : "No sessions have been assigned to you yet."
        }
        cta={
          role === "learner"
            ? { label: "Browse Tutors", href: "/dashboard/tutors" }
            : undefined
        }
      />
    );
  }

  const handleAddToCalendar = (session: Session) => {
    const [startH, startM] = (session.start_time || "09:00:00").split(":");
    const [endH, endM] = (session.end_time || "10:00:00").split(":");

    const start = new Date(session.scheduled_date);
    start.setHours(parseInt(startH), parseInt(startM));

    const end = new Date(session.scheduled_date);
    end.setHours(parseInt(endH), parseInt(endM));

    const tutorName = session.tutors?.profiles?.full_name || "Tutor";

    const ics = generateIcsFile({
      title: `Tutoring Session with ${tutorName}`,
      description: `ScholarMe Tutoring Session.\nSpecialization: ${session.specializations?.name || "General"}`,
      startTime: start,
      endTime: end,
      tutorName,
    });

    downloadIcs(`scholarme-session-${session.id.substring(0, 8)}`, ics);
  };

  return (
    <div className="flex flex-col gap-3">
      {sessions.map((session) => {
        const hasRating =
          session.session_ratings && session.session_ratings.length > 0;
        const canRate =
          role === "learner" && session.status === "completed" && !hasRating;

        const sessionDateObj = new Date(
          `${session.scheduled_date}T${session.start_time || "00:00:00"}`,
        );

        return (
          <Card key={session.id} className="border-border/60">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">
                    {role === "tutor"
                      ? `Session ${formatRelativeDate(sessionDateObj)}`
                      : session.tutors?.profiles?.full_name || "Tutor"}
                  </span>
                  <Badge
                    className={SESSION_STATUS_COLORS[session.status] || ""}
                    variant="outline"
                  >
                    {session.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {sessionDateObj.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {session.start_time?.slice(0, 5)} -{" "}
                    {session.end_time?.slice(0, 5)}
                  </span>
                </div>

                {session.specializations && (
                  <Badge variant="secondary" className="text-xs w-fit mt-1">
                    {session.specializations.name}
                  </Badge>
                )}
                {hasRating && (
                  <div className="flex items-center gap-1 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${
                          i < (session.session_ratings?.[0]?.rating || 0)
                            ? "fill-accent text-accent"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {session.notes && (
                <div className="mt-4 bg-muted/30 p-3 rounded-md text-sm border border-border/50">
                  <div className="font-semibold text-foreground mb-1 flex items-center gap-1">
                    <span role="img" aria-label="notes">
                      📝
                    </span>{" "}
                    Preparation Notes
                  </div>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {session.notes}
                  </p>
                </div>
              )}

              {/* Reschedule Alert for Learner */}
              {role === "learner" &&
                session.reschedule_requested_date &&
                session.status === "confirmed" && (
                  <div className="mt-4 bg-orange-500/10 border border-orange-500/20 p-3 rounded-md text-sm">
                    <div className="font-semibold text-orange-600 dark:text-orange-400 mb-2">
                      Tutor requested a reschedule
                    </div>
                    <p className="text-muted-foreground mb-3">
                      Proposed new time:{" "}
                      {new Date(
                        session.reschedule_requested_date,
                      ).toLocaleDateString()}{" "}
                      from {session.reschedule_requested_start?.slice(0, 5)} to{" "}
                      {session.reschedule_requested_end?.slice(0, 5)}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          onUpdateStatus(session.id, "confirmed", {
                            scheduled_date: session.reschedule_requested_date,
                            start_time: session.reschedule_requested_start,
                            end_time: session.reschedule_requested_end,
                            reschedule_requested_date: null,
                            reschedule_requested_start: null,
                            reschedule_requested_end: null,
                          })
                        }
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          onUpdateStatus(session.id, "confirmed", {
                            reschedule_requested_date: null,
                            reschedule_requested_start: null,
                            reschedule_requested_end: null,
                          })
                        }
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                )}

              {/* Substitution Alert for Target Tutor */}
              {role === "tutor" &&
                session.transfer_to_tutor_id &&
                session.status === "confirmed" && (
                  <div className="mt-4 bg-blue-500/10 border border-blue-500/20 p-3 rounded-md text-sm">
                    <div className="font-semibold text-blue-600 dark:text-blue-400 mb-2">
                      Substitution Request
                    </div>
                    <p className="text-muted-foreground mb-3">
                      Another tutor has requested you to substitute this
                      session.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          onUpdateStatus(session.id, "confirmed", {
                            tutor_id: session.transfer_to_tutor_id,
                            transfer_to_tutor_id: null,
                          })
                        }
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          onUpdateStatus(session.id, "confirmed", {
                            transfer_to_tutor_id: null,
                          })
                        }
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                )}

              {/* Substitution Pending Alert for Original Tutor */}
              {role === "tutor" &&
                session.transfer_to_tutor_id &&
                session.tutor_id !== session.transfer_to_tutor_id &&
                session.status === "confirmed" && (
                  <div className="mt-4 bg-muted/50 border border-border/50 p-3 rounded-md text-sm text-muted-foreground flex items-center justify-between">
                    <span>
                      Waiting for substitute tutor to accept transfer...
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        onUpdateStatus(session.id, "confirmed", {
                          transfer_to_tutor_id: null,
                        })
                      }
                    >
                      Cancel Transfer
                    </Button>
                  </div>
                )}

              <div className="flex items-center gap-2 mt-4 sm:mt-0">
                {role === "tutor" && session.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => {
                        setConfirmingSession(session);
                        setMeetingLink("");
                      }}
                    >
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                      Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onUpdateStatus(session.id, "cancelled")}
                    >
                      <XCircle className="mr-1 h-3.5 w-3.5" />
                      Decline
                    </Button>
                  </>
                )}
                {role === "tutor" && session.status === "confirmed" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onUpdateStatus(session.id, "completed");
                        import("@/components/ui/confetti").then((m) =>
                          m.triggerConfetti(),
                        );
                      }}
                    >
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                      Mark Complete
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onUpdateStatus(session.id, "no_show")}
                    >
                      <XCircle className="mr-1 h-3.5 w-3.5" />
                      No-Show
                    </Button>
                  </>
                )}
                {session.status === "confirmed" && session.meeting_link && (
                  <Button size="sm" variant="default" asChild>
                    <a
                      href={session.meeting_link}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Video className="mr-1 h-3.5 w-3.5" />
                      Join Meeting
                    </a>
                  </Button>
                )}
                {session.status === "confirmed" && role === "tutor" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setRescheduleSession(session);
                        setNewDate(session.scheduled_date);
                        setNewStart(session.start_time);
                        setNewEnd(session.end_time);
                      }}
                    >
                      <RefreshCw className="mr-1 h-3.5 w-3.5" />
                      Reschedule
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenTransfer(session)}
                    >
                      <UserPlus className="mr-1 h-3.5 w-3.5" />
                      Substitute
                    </Button>
                  </div>
                )}
                {session.status === "confirmed" && (
                  <>
                    <Button size="sm" asChild>
                      <Link
                        href={`/dashboard/sessions/${session.id}/whiteboard`}
                      >
                        <PenTool className="mr-1 h-3.5 w-3.5" />
                        Whiteboard
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddToCalendar(session)}
                    >
                      <CalendarPlus className="mr-1 h-3.5 w-3.5" />
                      Calendar
                    </Button>
                  </>
                )}
                {session.status === "pending" && role === "learner" && (
                  <ConfirmDialog
                    trigger={
                      <Button size="sm" variant="outline">
                        Cancel
                      </Button>
                    }
                    title="Cancel this session?"
                    description="This will notify the tutor. Cancelled sessions cannot be reopened."
                    confirmLabel="Yes, cancel"
                    onConfirm={() => onUpdateStatus(session.id, "cancelled")}
                  />
                )}
                {canRate && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRate(session)}
                  >
                    <Star className="mr-1 h-3.5 w-3.5" />
                    Rate
                  </Button>
                )}
                {session.status === "completed" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-primary border-primary/20 hover:bg-primary/10"
                    onClick={() => onSummary(session)}
                  >
                    <Sparkles className="mr-1 h-3.5 w-3.5" />
                    AI Summary
                  </Button>
                )}
                {role === "learner" && session.status === "completed" && (
                  <Button size="sm" variant="default" asChild>
                    <Link href={`/dashboard/tutors/${session.tutor_id}`}>
                      Book Again
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Confirm Session Dialog */}
      <Dialog
        open={!!confirmingSession}
        onOpenChange={() => setConfirmingSession(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Session</DialogTitle>
            <DialogDescription>
              Provide a meeting link for this remote session (optional).
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label>Meeting Link (Zoom, Meet, etc)</Label>
              <Input
                placeholder="https://zoom.us/j/..."
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmingSession(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (confirmingSession) {
                  onUpdateStatus(confirmingSession.id, "confirmed", {
                    meeting_link: meetingLink,
                  });
                  setConfirmingSession(null);
                }
              }}
            >
              Confirm Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog
        open={!!rescheduleSession}
        onOpenChange={() => setRescheduleSession(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Session</DialogTitle>
            <DialogDescription>
              Change the date or time for this session.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label>New Date</Label>
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label>New Start Time</Label>
                <Input
                  type="time"
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>New End Time</Label>
                <Input
                  type="time"
                  value={newEnd}
                  onChange={(e) => setNewEnd(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRescheduleSession(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (rescheduleSession) {
                  onUpdateStatus(rescheduleSession.id, "confirmed", {
                    reschedule_requested_date: newDate,
                    reschedule_requested_start: newStart,
                    reschedule_requested_end: newEnd,
                  });
                  setRescheduleSession(null);
                  toast.success("Reschedule request sent to learner");
                }
              }}
            >
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Substitute Dialog */}
      <Dialog
        open={!!transferSession}
        onOpenChange={() => setTransferSession(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Substitute Session</DialogTitle>
            <DialogDescription>
              Transfer this session to another available tutor. They will
              receive a request to accept the transfer.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="space-y-2">
              <Label>Select Substitute Tutor</Label>
              {transferLoading ? (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading available tutors...
                </div>
              ) : (
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={selectedTutorId}
                  onChange={(e) => setSelectedTutorId(e.target.value)}
                >
                  <option value="" disabled>
                    Select a tutor...
                  </option>
                  {availableTutors.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.profiles?.full_name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferSession(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmTransfer}
              disabled={!selectedTutorId || transferLoading}
            >
              Transfer Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
