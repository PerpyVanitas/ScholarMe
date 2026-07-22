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
  Clock,
  Loader2,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { DEMO_USERS, getDemoUserFromCookie } from "@/scripts/demo";
import type { Session, UserRole } from "@/lib/types";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton-card";
import { SessionSummaryModal } from "./components/session-summary-modal";
import { SessionList } from "./components/session-list";
import {
  getMyWaitlists,
  getTutorWaitlist,
} from "@/features/tutors/api/waitlist-actions";

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
  const [waitlists, setWaitlists] = useState<Record<string, unknown>[]>([]);
  const [currentTutorId, setCurrentTutorId] = useState<string | null>(null);

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

      if (userRole === "tutor") {
        // For tutor, find their tutor record first
        const { data: tutor } = await supabase
          .from("tutors")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        const tutorId =
          tutor?.id || (userRole === "tutor" ? DEMO_USERS.tutor.tutorId : "");
        setCurrentTutorId(tutorId);
        const { data: tutorSessions } = await supabase
          .from("sessions")
          .select(
            "*, specializations(*), session_ratings(*), original_tutor:tutors!tutor_id(profiles(*))",
          )
          .or(`tutor_id.eq.${tutorId},transfer_to_tutor_id.eq.${tutorId}`)
          .order("scheduled_date", { ascending: false });

        setSessions(tutorSessions || []);

        if (tutorId) {
          const tw = await getTutorWaitlist(tutorId);
          setWaitlists(tw);
        } else {
          const mw = await getMyWaitlists();
          setWaitlists(mw);
        }

        setLoading(false);
        return;
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

        const mw = await getMyWaitlists();
        setWaitlists(mw);

        setLoading(false);
        return;
      }
    }
    load();
  }, []);

  async function updateStatus(
    sessionId: string,
    status: string,
    extraData?: Record<string, unknown>,
  ) {
    const session = sessions.find((s) => s.id === sessionId);

    const res = await fetch(`/api/sessions/${sessionId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, ...(extraData || {}) }),
    });

    if (res.ok) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                status: status as Session["status"],
                ...(extraData || {}),
              }
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
          "SESSION_COMPLETED",
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
          <TabsTrigger value="waitlists" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Waitlists ({waitlists.length})
          </TabsTrigger>
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
            currentTutorId={currentTutorId || undefined}
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
            currentTutorId={currentTutorId || undefined}
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

        <TabsContent value="waitlists" className="mt-4">
          {waitlists.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No Waitlists"
              description="You are not on any waitlists."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {waitlists.map((w) => (
                <Card key={w.id} className="border-border/60">
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">
                        {role === "tutor"
                          ? `Waitlist: ${w.learner?.full_name}`
                          : `Waitlist: ${w.tutor?.profiles?.full_name || "Tutor"}`}
                      </span>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          Requested Date:{" "}
                          {new Date(w.requested_date).toLocaleDateString()}
                        </span>
                        <Badge variant="secondary">{w.status}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
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
