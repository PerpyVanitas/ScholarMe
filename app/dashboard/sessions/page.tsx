"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
} from "lucide-react";
import { toast } from "sonner";
import type { Session, UserRole } from "@/lib/types";

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning-foreground border-warning/30",
  confirmed: "bg-primary/10 text-primary border-primary/30",
  completed: "bg-success/10 text-success border-success/30",
  cancelled: "bg-destructive/10 text-destructive border-destructive/30",
};

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole>("learner");
  const [ratingSession, setRatingSession] = useState<Session | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingFeedback, setRatingFeedback] = useState("");
  const [ratingLoading, setRatingLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*, roles(*)")
        .eq("id", user.id)
        .single();

      const userRole = (profile?.roles?.name || "learner") as UserRole;
      setRole(userRole);

      let query;
      if (userRole === "tutor") {
        const { data: tutor } = await supabase
          .from("tutors")
          .select("id")
          .eq("user_id", user.id)
          .single();
        query = supabase
          .from("sessions")
          .select("*, specializations(*), session_ratings(*)")
          .eq("tutor_id", tutor?.id || "")
          .order("scheduled_date", { ascending: false });
      } else {
        query = supabase
          .from("sessions")
          .select("*, tutors(*, profiles(*)), specializations(*), session_ratings(*)")
          .eq("learner_id", user.id)
          .order("scheduled_date", { ascending: false });
      }

      const { data } = await query;
      setSessions(data || []);
      setLoading(false);
    }
    load();
  }, []);

  async function updateStatus(sessionId: string, status: string) {
    const res = await fetch(`/api/sessions/${sessionId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (res.ok) {
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, status: status as Session["status"] } : s))
      );
      toast.success(`Session ${status}`);
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
                  { id: "", session_id: s.id, learner_id: "", rating: ratingValue, feedback: ratingFeedback, created_at: "" },
                ],
              }
            : s
        )
      );
      setRatingSession(null);
      setRatingValue(0);
      setRatingFeedback("");
    } else {
      toast.error("Failed to submit rating");
    }
    setRatingLoading(false);
  }

  const upcoming = sessions.filter((s) => ["pending", "confirmed"].includes(s.status));
  const past = sessions.filter((s) => ["completed", "cancelled"].includes(s.status));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
          {role === "tutor" ? "Sessions assigned to you" : "Your tutoring sessions"}
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
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          <SessionList
            sessions={upcoming}
            role={role}
            onUpdateStatus={updateStatus}
            onRate={(s) => setRatingSession(s)}
          />
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          <SessionList
            sessions={past}
            role={role}
            onUpdateStatus={updateStatus}
            onRate={(s) => setRatingSession(s)}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={!!ratingSession} onOpenChange={() => setRatingSession(null)}>
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
            <Button onClick={submitRating} disabled={ratingLoading || ratingValue === 0}>
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
    </div>
  );
}

function SessionList({
  sessions,
  role,
  onUpdateStatus,
  onRate,
}: {
  sessions: Session[];
  role: UserRole;
  onUpdateStatus: (id: string, status: string) => void;
  onRate: (session: Session) => void;
}) {
  if (sessions.length === 0) {
    return (
      <Card className="border-border/60">
        <CardContent className="flex flex-col items-center gap-3 py-12">
          <div className="rounded-full bg-muted p-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No sessions found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {sessions.map((session) => {
        const hasRating = session.session_ratings && session.session_ratings.length > 0;
        const canRate = role === "learner" && session.status === "completed" && !hasRating;

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
                  <Badge className={statusColors[session.status] || ""} variant="outline">
                    {session.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(session.scheduled_date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {session.start_time?.slice(0, 5)} - {session.end_time?.slice(0, 5)}
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

              <div className="flex items-center gap-2">
                {role === "tutor" && session.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => onUpdateStatus(session.id, "confirmed")}
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
                  <Button
                    size="sm"
                    onClick={() => onUpdateStatus(session.id, "completed")}
                  >
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                    Mark Complete
                  </Button>
                )}
                {session.status === "pending" && role === "learner" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onUpdateStatus(session.id, "cancelled")}
                  >
                    Cancel
                  </Button>
                )}
                {canRate && (
                  <Button size="sm" variant="outline" onClick={() => onRate(session)}>
                    <Star className="mr-1 h-3.5 w-3.5" />
                    Rate
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
