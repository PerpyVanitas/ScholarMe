/** Sessions page -- shared by learners (cancel / rate) and tutors (confirm / complete). */
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
  Star,
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
} from "lucide-react";
import { toast } from "sonner";
import { SESSION_STATUS_COLORS } from "@/lib/constants";
import { DEMO_USERS, getDemoUserFromCookie } from "@/scripts/demo";
import type { Session, UserRole } from "@/lib/types";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton-card";
import { generateIcsFile, downloadIcs } from "@/lib/utils/calendar";
import { SessionSummaryModal } from "./components/session-summary-modal";

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [openGroupSessions, setOpenGroupSessions] = useState<Session[]>([]);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole>("learner");
  const [ratingSession, setRatingSession] = useState<Session | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingFeedback, setRatingFeedback] = useState("");
  const [ratingLoading, setRatingLoading] = useState(false);
  const [summarySession, setSummarySession] = useState<Session | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Determine user ID and role - support demo mode
      let userId = user?.id;
      let userRole: UserRole = "learner";

      if (userId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*, roles(*)")
          .eq("id", userId)
          .single();
        userRole = (profile?.roles?.name || "learner") as UserRole;
      } else {
        const demo = getDemoUserFromCookie("learner");
        userRole = demo.role;
        userId = demo.userId;
      }

      setRole(userRole);

      let query;
      if (userRole === "tutor") {
        // For tutor, find their tutor record first
        const { data: tutor } = await supabase
          .from("tutors")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        const tutorId =
          tutor?.id || (userRole === "tutor" ? DEMO_USERS.tutor.tutorId : "");
        query = supabase
          .from("sessions")
          .select(
            "*, specializations(*), session_ratings(*), original_tutor:tutors!tutor_id(profiles(*))",
          )
          .or(`tutor_id.eq.${tutorId},transfer_to_tutor_id.eq.${tutorId}`)
          .order("scheduled_date", { ascending: false });
      } else {
        const sessionSelect =
          "*, tutors(*, profiles(*)), specializations(*, profiles(*)), session_ratings(*), session_participants(count)";

        const [{ data: owned }, { data: joinedRows }] = await Promise.all([
          supabase
            .from("sessions")
            .select(sessionSelect)
            .eq("learner_id", userId)
            .order("scheduled_date", { ascending: false }),
          supabase
            .from("session_participants")
            .select(`sessions(${sessionSelect})`)
            .eq("learner_id", userId),
        ]);

        const joinedSessions = (joinedRows || [])
          .map((row: { sessions: Session | Session[] | null }) =>
            Array.isArray(row.sessions) ? row.sessions[0] : row.sessions,
          )
          .filter(Boolean) as Session[];

        const merged = new Map<string, Session>();
        [...(owned || []), ...joinedSessions].forEach((s) =>
          merged.set(s.id, s),
        );
        setSessions(Array.from(merged.values()));

        const today = new Date().toISOString().split("T")[0];
        const { data: openGroups } = await supabase
          .from("sessions")
          .select(sessionSelect)
          .gt("max_participants", 1)
          .in("status", ["pending", "confirmed"])
          .gte("scheduled_date", today)
          .order("scheduled_date", { ascending: true });

        const filteredOpen = (openGroups || []).filter((s: Session) => {
          const count =
            (s as Session & { session_participants?: { count: number }[] })
              .session_participants?.[0]?.count ?? 0;
          const isHost = s.learner_id === userId;
          const isFull = count >= (s.max_participants || 1);
          const alreadyJoined = merged.has(s.id) && s.learner_id !== userId;
          return !isHost && !isFull && !alreadyJoined;
        });

        setOpenGroupSessions(filteredOpen);
        setLoading(false);
        return;
      }

      const { data } = await query;
      setSessions(data || []);
      setLoading(false);
    }
    load();
  }, []);

  async function updateStatus(
    sessionId: string,
    status: string,
    extraData?: any,
  ) {
    const session = sessions.find((s) => s.id === sessionId);

    const res = await fetch(`/api/sessions/${sessionId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, ...extraData }),
    });

    if (res.ok) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? { ...s, status: status as Session["status"], ...extraData }
            : s,
        ),
      );
      toast.success(`Session ${status}`);

      // Earn XP if completing a session as a tutor
      if (
        status === "completed" &&
        role === "tutor" &&
        session &&
        session.start_time &&
        session.end_time
      ) {
        const startHour = parseInt(session.start_time.split(":")[0]);
        const startMin = parseInt(session.start_time.split(":")[1]);
        const endHour = parseInt(session.end_time.split(":")[0]);
        const endMin = parseInt(session.end_time.split(":")[1]);
        const durationHours =
          endHour + endMin / 60 - (startHour + startMin / 60);

        // 25 XP per hour, minimum 1 hour if it's less
        const earnedXp = Math.max(25, Math.round(durationHours * 25));

        const { earnXp } = await import("@/lib/utils/gamification");
        const xpData = await earnXp(
          earnedXp,
          `Tutoring Session (${durationHours.toFixed(1)} hrs)`,
        );

        if (xpData.success) {
          toast.success(`🎉 +${earnedXp} XP Earned!`, {
            description: xpData.current_level
              ? `You are now Level ${xpData.current_level}`
              : "Great job helping a fellow student!",
          });
        }
      }
    } else {
      toast.error("Failed to update session");
    }
  }

  async function submitRating() {
    if (!ratingSession || ratingValue === 0) return;
    setRatingLoading(true);

    const res = await fetch(`/api/sessions/${ratingSession.id}/rate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: ratingValue, feedback: ratingFeedback }),
    });

    if (res.ok) {
      toast.success("Rating submitted!");
      setSessions((prev) =>
        prev.map((s) =>
          s.id === ratingSession.id
            ? {
                ...s,
                session_ratings: [
                  {
                    id: "",
                    session_id: s.id,
                    learner_id: "",
                    rating: ratingValue,
                    feedback: ratingFeedback,
                    created_at: "",
                  },
                ],
              }
            : s,
        ),
      );
      setRatingSession(null);
      setRatingValue(0);
      setRatingFeedback("");
    } else {
      toast.error("Failed to submit rating");
    }
    setRatingLoading(false);
  }

  async function joinGroupSession(sessionId: string) {
    setJoiningId(sessionId);
    const res = await fetch(`/api/sessions/${sessionId}/join`, {
      method: "POST",
    });
    const data = await res.json();
    if (res.ok) {
      toast.success("Joined group session!");
      const joined = openGroupSessions.find((s) => s.id === sessionId);
      if (joined) {
        setSessions((prev) => [...prev, joined]);
        setOpenGroupSessions((prev) => prev.filter((s) => s.id !== sessionId));
      }
    } else {
      toast.error(data.error || "Failed to join session");
    }
    setJoiningId(null);
  }

  const upcoming = sessions.filter((s) =>
    ["pending", "confirmed"].includes(s.status),
  );
  const past = sessions.filter((s) =>
    ["completed", "cancelled", "no_show"].includes(s.status),
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Sessions
          </h1>
          <p className="text-muted-foreground">Your tutoring sessions</p>
        </div>
        <SkeletonList rows={4} columns={4} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {role === "tutor" ? "My Sessions" : "Sessions"}
        </h1>
        <p className="text-muted-foreground">
          {role === "tutor"
            ? "Sessions assigned to you"
            : "Your tutoring sessions"}
        </p>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList>
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Upcoming ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Past ({past.length})
          </TabsTrigger>
          {role === "learner" && (
            <TabsTrigger
              value="open-groups"
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Open Groups ({openGroupSessions.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          <SessionList
            sessions={sessions.filter(
              (s) => s.status === "pending" || s.status === "confirmed",
            )}
            role={role}
            onUpdateStatus={updateStatus}
            onRate={setRatingSession}
            onSummary={setSummarySession}
          />
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          <SessionList
            sessions={sessions.filter(
              (s) =>
                s.status === "completed" ||
                s.status === "cancelled" ||
                s.status === "no_show",
            )}
            role={role}
            onUpdateStatus={updateStatus}
            onRate={setRatingSession}
            onSummary={setSummarySession}
          />
        </TabsContent>

        {role === "learner" && (
          <TabsContent value="open-groups" className="mt-4">
            {openGroupSessions.length === 0 ? (
              <EmptyState
                icon={UserPlus}
                title="No open group sessions"
                description="When tutors host group sessions with open spots, they'll appear here."
              />
            ) : (
              <div className="flex flex-col gap-3">
                {openGroupSessions.map((session) => {
                  const count =
                    (
                      session as Session & {
                        session_participants?: { count: number }[];
                      }
                    ).session_participants?.[0]?.count ?? 0;
                  const spotsLeft = (session.max_participants || 1) - count;
                  return (
                    <Card key={session.id} className="border-border/60">
                      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">
                            {session.tutors?.profiles?.full_name || "Tutor"} —
                            Group Session
                          </span>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(
                                session.scheduled_date,
                              ).toLocaleDateString()}
                            </span>
                            <span>
                              {session.start_time?.slice(0, 5)} –{" "}
                              {session.end_time?.slice(0, 5)}
                            </span>
                            <Badge variant="secondary">
                              {spotsLeft} spot{spotsLeft === 1 ? "" : "s"} left
                            </Badge>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => joinGroupSession(session.id)}
                          disabled={joiningId === session.id}
                        >
                          {joiningId === session.id ? (
                            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <UserPlus className="mr-1 h-3.5 w-3.5" />
                          )}
                          Join Session
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      <Dialog
        open={!!ratingSession}
        onOpenChange={() => setRatingSession(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate this Session</DialogTitle>
            <DialogDescription>
              How was your session? Your feedback helps improve the experience.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label>Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setRatingValue(v)}
                    className="p-1"
                    aria-label={`${v} star${v > 1 ? "s" : ""}`}
                  >
                    <Star
                      className={`h-7 w-7 ${
                        v <= ratingValue
                          ? "fill-accent text-accent"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="feedback">Feedback (optional)</Label>
              <Textarea
                id="feedback"
                value={ratingFeedback}
                onChange={(e) => setRatingFeedback(e.target.value)}
                placeholder="Share your experience..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRatingSession(null)}>
              Cancel
            </Button>
            <Button
              onClick={submitRating}
              disabled={ratingLoading || ratingValue === 0}
            >
              {ratingLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Rating"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SessionSummaryModal
        session={summarySession}
        open={!!summarySession}
        onOpenChange={(open) => {
          if (!open) setSummarySession(null);
        }}
      />
    </div>
  );
}

function SessionList({
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
      description: `ScholarMe Tutoring Session.\\nSpecialization: ${session.specializations?.name || "General"}`,
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

        return (
          <Card key={session.id} className="border-border/60">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">
                    {role === "tutor"
                      ? `Session on ${new Date(session.scheduled_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
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
                    {new Date(session.scheduled_date).toLocaleDateString(
                      "en-US",
                      {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      },
                    )}
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
                      onClick={() => onUpdateStatus(session.id, "completed")}
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
