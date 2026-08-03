"use client";

import { useEffect, useState, useCallback } from "react";
import { format, parseISO } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  QrCode,
  CheckCircle2,
  Sparkles,
  Loader2,
  Camera,
  UserCheck,
} from "lucide-react";
import { FacilityEvent, RsvpStatus } from "@/lib/types";
import { useUser } from "@/lib/user-context";
import { updateEventRsvp } from "@/features/events/api/actions";
import { ContinuousQrScanner } from "@/components/ui/qr-scanner-continuous";
import { triggerConfetti } from "@/lib/utils/gamification";
import { toast } from "sonner";
import QRCode from "react-qr-code";

interface EventDetailModalProps {
  event: FacilityEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRsvpUpdate?: () => void;
}

export function EventDetailModal({
  event,
  open,
  onOpenChange,
  onRsvpUpdate,
}: EventDetailModalProps) {
  const { profile } = useUser();
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showUserQr, setShowUserQr] = useState(false);

  const [stats, setStats] = useState<{
    joinedCount: number;
    checkedInCount: number;
    completedCount: number;
    userAttendance: {
      status: "checked_in" | "completed";
      check_in_time: string;
      check_out_time?: string | null;
      duration_minutes?: number | null;
      xp_awarded?: number;
    } | null;
  }>({
    joinedCount: 0,
    checkedInCount: 0,
    completedCount: 0,
    userAttendance: null,
  });

  const fetchAttendanceStats = useCallback(async () => {
    if (!event?.id) return;
    try {
      const res = await fetch(`/api/v1/events/${event.id}/attendance`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // Ignore background errors
    }
  }, [event]);

  useEffect(() => {
    if (open && event?.id) {
      fetchAttendanceStats();
    } else {
      setShowScanner(false);
      setShowUserQr(false);
    }
  }, [open, event?.id, fetchAttendanceStats]);

  if (!event) return null;

  const now = new Date();
  const startDate = parseISO(event.start_time);
  const endDate = parseISO(event.end_time);

  const isOngoing = now >= startDate && now <= endDate;
  const isPast = now > endDate;
  const isUpcoming = now < startDate;

  const userRsvp = event.event_rsvps?.find(
    (r) => r.profile_id === profile?.id
  )?.status;

  async function handleRsvp(status: RsvpStatus) {
    if (!event) return;
    setRsvpLoading(true);
    try {
      await updateEventRsvp(event.id, status);
      toast.success(`RSVP updated to ${status.replace("_", " ")}`);
      onRsvpUpdate?.();
    } catch {
      toast.error("Failed to update RSVP");
    } finally {
      setRsvpLoading(false);
    }
  }

  async function handleAttendanceAction(action: "check_in" | "check_out", scannedUserId?: string) {
    if (!event) return;
    setAttendanceLoading(true);
    try {
      const res = await fetch(`/api/v1/events/${event.id}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userId: scannedUserId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process attendance");
      }

      if (action === "check_out") {
        triggerConfetti();
        toast.success(data.message || `Checked out! Earned ${data.xpAwarded} XP`);
      } else {
        toast.success("Checked into event! Keep tab open to record stay time.");
      }

      setShowScanner(false);
      await fetchAttendanceStats();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error recording attendance");
    } finally {
      setAttendanceLoading(false);
    }
  }

  const userQrPayload = profile
    ? `scholarme_id:${profile.id}:${profile.full_name}`
    : `scholarme_event:${event.id}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg border-border/60 shadow-xl overflow-hidden p-0">
        <div className="p-6 border-b border-border/60 bg-gradient-to-r from-primary/10 via-background to-primary/5">
          <div className="flex items-center justify-between gap-2 mb-2">
            <Badge
              variant={event.is_mandatory ? "destructive" : "secondary"}
              className="text-xs font-semibold"
            >
              {event.is_mandatory ? "Mandatory Event" : "Voluntary Event"}
            </Badge>

            {isOngoing && (
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs font-semibold animate-pulse flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                ONGOING NOW
              </Badge>
            )}

            {isUpcoming && (
              <Badge variant="outline" className="text-xs">
                Upcoming
              </Badge>
            )}
            {isPast && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                Concluded
              </Badge>
            )}
          </div>

          <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
            {event.title}
          </DialogTitle>

          <DialogDescription className="text-sm text-muted-foreground mt-1 flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1 text-foreground/80">
              <CalendarIcon className="h-4 w-4 text-primary" />
              {format(startDate, "EEEE, MMMM d, yyyy")}
            </span>
            <span className="flex items-center gap-1 text-foreground/80">
              <Clock className="h-4 w-4 text-primary" />
              {format(startDate, "h:mm a")} - {format(endDate, "h:mm a")}
            </span>
          </DialogDescription>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* General Event Gist & Aggregate Metrics (NO individual names) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/50 border border-border/40 flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Joined / RSVP</p>
                <p className="text-lg font-bold text-foreground">
                  {stats.joinedCount || (event.event_rsvps?.length || 0)} Members
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted/50 border border-border/40 flex items-center gap-3">
              <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Checked In Now</p>
                <p className="text-lg font-bold text-foreground">
                  {stats.checkedInCount} Present
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          {event.description ? (
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                Event Overview
              </h4>
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line bg-muted/30 p-3 rounded-lg border border-border/30">
                {event.description}
              </p>
            </div>
          ) : (
            <p className="text-sm italic text-muted-foreground">
              No additional description provided.
            </p>
          )}

          {/* User Attendance Status Badge */}
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Attendance & Participation XP
              </h4>

              {stats.userAttendance?.status === "completed" && (
                <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                  + {stats.userAttendance.xp_awarded} XP Earned
                </Badge>
              )}
            </div>

            {stats.userAttendance?.status === "checked_in" && (
              <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>
                  Checked in at{" "}
                  <strong>
                    {format(parseISO(stats.userAttendance.check_in_time), "h:mm a")}
                  </strong>
                  . Stay until checkout to earn XP!
                </span>
              </div>
            )}

            {stats.userAttendance?.status === "completed" && (
              <div className="text-xs text-muted-foreground bg-muted/60 p-2.5 rounded-lg">
                Participation Completed! Stayed for{" "}
                <strong>{stats.userAttendance.duration_minutes || 0} mins</strong>.
              </div>
            )}

            {!stats.userAttendance && (
              <p className="text-xs text-muted-foreground">
                Attendance is tracked via QR scanner during the event. Stay time yields +1 XP/min (up to 200 XP).
              </p>
            )}
          </div>

          {/* Ongoing Attendance Controls */}
          {isOngoing && (
            <div className="space-y-3 pt-2 border-t border-border/40">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                Event Attendance Actions
              </h4>

              {showScanner ? (
                <div className="space-y-2">
                  <ContinuousQrScanner
                    title="Scan Event QR Code"
                    onScanSuccess={async (decodedText) => {
                      // Check if it's an event QR or user ID QR
                      if (decodedText.startsWith("scholarme_id:")) {
                        const parts = decodedText.split(":");
                        const scannedUser = parts[1];
                        await handleAttendanceAction(
                          stats.userAttendance?.status === "checked_in"
                            ? "check_out"
                            : "check_in",
                          scannedUser
                        );
                      } else {
                        await handleAttendanceAction(
                          stats.userAttendance?.status === "checked_in"
                            ? "check_out"
                            : "check_in"
                        );
                      }
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => setShowScanner(false)}
                  >
                    Cancel Camera Scanner
                  </Button>
                </div>
              ) : showUserQr ? (
                <div className="flex flex-col items-center gap-3 bg-white p-4 rounded-xl text-slate-900 border">
                  <QRCode value={userQrPayload} size={160} />
                  <p className="text-xs font-medium text-slate-600 text-center">
                    Show this QR code at the desk or scanner to record attendance
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setShowUserQr(false)}
                  >
                    Hide QR Code
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2">
                  {stats.userAttendance?.status === "checked_in" ? (
                    <Button
                      className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs"
                      onClick={() => handleAttendanceAction("check_out")}
                      disabled={attendanceLoading}
                    >
                      {attendanceLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      )}
                      Check Out & Claim XP
                    </Button>
                  ) : (
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
                      onClick={() => handleAttendanceAction("check_in")}
                      disabled={attendanceLoading || stats.userAttendance?.status === "completed"}
                    >
                      {attendanceLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <UserCheck className="h-4 w-4 mr-2" />
                      )}
                      {stats.userAttendance?.status === "completed"
                        ? "Completed"
                        : "Check In to Event"}
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    className="text-xs"
                    onClick={() => setShowScanner(true)}
                  >
                    <Camera className="h-4 w-4 mr-1.5" />
                    Scan QR
                  </Button>

                  <Button
                    variant="outline"
                    className="text-xs"
                    onClick={() => setShowUserQr(true)}
                  >
                    <QrCode className="h-4 w-4 mr-1.5" />
                    My QR ID
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Upcoming RSVP Options */}
          {isUpcoming && (
            <div className="space-y-2 pt-2 border-t border-border/40">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                RSVP for Event
              </h4>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={userRsvp === "going" ? "default" : "outline"}
                  className="flex-1 text-xs"
                  onClick={() => handleRsvp("going")}
                  disabled={rsvpLoading}
                >
                  Going
                </Button>

                <Button
                  size="sm"
                  variant={userRsvp === "maybe" ? "default" : "outline"}
                  className="flex-1 text-xs"
                  onClick={() => handleRsvp("maybe")}
                  disabled={rsvpLoading}
                >
                  Maybe
                </Button>

                <Button
                  size="sm"
                  variant={userRsvp === "not_going" ? "default" : "outline"}
                  className="flex-1 text-xs"
                  onClick={() => handleRsvp("not_going")}
                  disabled={rsvpLoading}
                >
                  Not Going
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
