// @ts-nocheck
/**
 * ==========================================================================
 * TUTOR DETAIL PAGE - View Profile & Book Session
 * ==========================================================================
 *
 * PURPOSE: Shows a single tutor's full profile including:
 * - Name, avatar, rating, specializations
 * - Bio text
 * - Weekly availability schedule (grouped by day)
 * - "Book Session" button that opens a booking dialog
 *
 * BOOKING FLOW:
 * 1. Learner clicks "Book Session"
 * 2. Dialog opens with date, time, subject, and notes fields
 * 3. On submit, POST /api/sessions creates the session with status "pending"
 * 4. Redirects to /dashboard/sessions where the new booking appears
 *
 * DYNAMIC ROUTE: /dashboard/tutors/[id]
 * The `[id]` is the tutor's UUID (from the tutors table, NOT profiles.id).
 * Next.js 16: params is a Promise, so we use React's `use()` to unwrap it.
 * ==========================================================================
 */
"use client";

import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Star,
  Calendar,
  Clock,
  Loader2,
  ArrowLeft,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Tutor, TutorAvailability, Specialization } from "@/lib/types";
import { DAYS_OF_WEEK } from "@/lib/types";
import { joinWaitlist } from "@/features/tutors/api/waitlist-actions";

export default function TutorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [availability, setAvailability] = useState<TutorAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState("learner");
  const [currentTutorId, setCurrentTutorId] = useState("");

  // Peer review
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  // Booking form
  const [bookDate, setBookDate] = useState("");
  const [bookStart, setBookStart] = useState("");
  const [bookEnd, setBookEnd] = useState("");
  const [bookSpec, setBookSpec] = useState("");
  const [bookNotes, setBookNotes] = useState("");
  const [bookPrepNotes, setBookPrepNotes] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [groupSize, setGroupSize] = useState("1");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*, roles(*)")
          .eq("id", user.id)
          .single();
        if (profile?.roles?.name === "tutor") {
          setCurrentUserRole("tutor");
          const { data: currentTutor } = await supabase
            .from("tutors")
            .select("id")
            .eq("user_id", user.id)
            .single();
          if (currentTutor) setCurrentTutorId(currentTutor.id);
        }
      }

      const [tutorRes, availRes] = await Promise.all([
        supabase
          .from("tutors")
          .select(
            "*, profiles(*), tutor_specializations(mastery_level, specializations(*))",
          )
          .eq("id", id)
          .single(),
        supabase
          .from("tutor_availability")
          .select("*")
          .eq("tutor_id", id)
          .order("day_of_week"),
      ]);
      setTutor(tutorRes.data);
      setAvailability(availRes.data || []);
      setLoading(false);
    }
    load();
  }, [id]);

  async function handlePeerReview() {
    setReviewLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("tutor_reviews").insert({
      reviewer_id: currentTutorId,
      tutor_id: id,
      rating: reviewRating,
      feedback: reviewFeedback,
    });

    if (error) {
      toast.error("Failed to submit peer review");
    } else {
      toast.success("Peer review submitted successfully");
      setReviewOpen(false);
    }
    setReviewLoading(false);
  }

  async function handleBook() {
    if (!bookDate || !bookStart || !bookEnd) {
      toast.error("Please fill in date and time");
      return;
    }
    setBookingLoading(true);

    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tutor_id: id,
        scheduled_date: bookDate,
        start_time: bookStart,
        end_time: bookEnd,
        specialization_id: bookSpec || null,
        notes: bookNotes || null,
        prep_notes: bookPrepNotes || null,
        is_recurring: isRecurring,
        max_participants: Number(groupSize) || 1,
      }),
    });

    if (res.ok) {
      toast.success("Session booked successfully!");
      setBookingOpen(false);
      router.push("/dashboard/sessions");
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to book session");
    }
    setBookingLoading(false);
  }

  async function handleWaitlist() {
    setWaitlistLoading(true);
    try {
      await joinWaitlist(id, new Date().toISOString().split("T")[0]);
      toast.success("Joined waitlist! You will be notified when slots open.");
     
    } catch (e: unknown) {
      // @ts-ignore
      toast.error(e.message || "Failed to join waitlist");
    } finally {
      setWaitlistLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <p className="text-muted-foreground">Tutor not found</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/tutors">Back to Tutors</Link>
        </Button>
      </div>
    );
  }

  const name = tutor.profiles?.full_name || "Tutor";
  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const specs = tutor.tutor_specializations || [];

  // Group availability by day
  const availByDay = DAYS_OF_WEEK.map((day, idx) => ({
    day,
    slots: availability.filter((a) => a.day_of_week === idx),
  }));

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <Button asChild variant="ghost" className="w-fit -ml-2">
        <Link href="/dashboard/tutors" className="flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back to Tutors
        </Link>
      </Button>

      <Card className="border-border/60">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-1">
                <h1 className="text-xl font-bold text-foreground">{name}</h1>
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-accent text-accent" />
                  <span className="text-sm text-muted-foreground">
                    {tutor.rating > 0 ? tutor.rating.toFixed(1) : "New tutor"}{" "}
                    {tutor.total_ratings > 0 &&
                      `(${tutor.total_ratings} reviews)`}
                  </span>
                </div>
                {specs.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    {specs.map((s: unknown) => (
                      <Badge
                        // @ts-ignore
                        key={s.specializations.id}
                        variant="secondary"
                        className="text-xs"
                      >
                        // @ts-ignore
                        {s.specializations.name}
                        // @ts-ignore
                        {s.mastery_level && s.mastery_level !== "standard" && (
                          <span className="ml-1 text-[10px] uppercase text-primary border border-primary/20 bg-primary/10 px-1 rounded">
                            // @ts-ignore
                            {s.mastery_level}
                          </span>
                        )}
                      </Badge>
                    ))}
                  </div>
                )}
                {typeof tutor.strikes === "number" && tutor.strikes > 0 && (
                  <div className="flex items-center gap-1 mt-2 text-xs font-medium text-destructive">
                    <AlertTriangle className="h-3 w-3" />
                    {tutor.strikes} Active Strike{tutor.strikes > 1 ? "s" : ""}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Calendar className="mr-2 h-4 w-4" />
                    Book Session
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Book a Session with {name}</DialogTitle>
                    <DialogDescription>
                      Choose a date and time for your session.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col gap-4 py-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="book-date">Date</Label>
                      <Input
                        id="book-date"
                        type="date"
                        value={bookDate}
                        onChange={(e) => setBookDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="book-start">Start Time</Label>
                        <Input
                          id="book-start"
                          type="time"
                          value={bookStart}
                          onChange={(e) => setBookStart(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="book-end">End Time</Label>
                        <Input
                          id="book-end"
                          type="time"
                          value={bookEnd}
                          onChange={(e) => setBookEnd(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="prep-notes">
                        Preparation Notes & Links (optional)
                      </Label>
                      <Textarea
                        id="prep-notes"
                        placeholder="Share prep materials, syllabus links, or specific questions for your tutor..."
                        value={bookPrepNotes}
                        onChange={(e) => setBookPrepNotes(e.target.value)}
                        rows={3}
                      />
                    </div>
                    {specs.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <Label>Subject</Label>
                        <Select value={bookSpec} onValueChange={setBookSpec}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a subject" />
                          </SelectTrigger>
                          <SelectContent>
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            {specs.map((s: unknown) => (
                              <SelectItem
                                // @ts-ignore
                                key={s.specializations.id}
                                // @ts-ignore
                                value={s.specializations.id}
                              >
                                // @ts-ignore
                                {s.specializations.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="book-notes">
                        Session Notes (optional)
                      </Label>
                      <Textarea
                        id="book-notes"
                        value={bookNotes}
                        onChange={(e) => setBookNotes(e.target.value)}
                        placeholder="Topics you'd like to cover..."
                        rows={3}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="group-size">Group Size</Label>
                      <Select value={groupSize} onValueChange={setGroupSize}>
                        <SelectTrigger id="group-size">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <SelectItem key={n} value={String(n)}>
                              {n === 1 ? "1-on-1 session" : `Group of ${n}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                      <Switch
                        id="recurring-mode"
                        checked={isRecurring}
                        onCheckedChange={setIsRecurring}
                      />
                      <Label htmlFor="recurring-mode">
                        Repeat for the next 4 weeks
                      </Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setBookingOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleBook} disabled={bookingLoading}>
                      {bookingLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Booking...
                        </>
                      ) : (
                        "Confirm Booking"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                onClick={handleWaitlist}
                disabled={waitlistLoading}
              >
                {waitlistLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Clock className="mr-2 h-4 w-4" />
                )}
                Join Waitlist
              </Button>
            </div>
          </div>

          {tutor.bio && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-foreground mb-2">
                About
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {tutor.bio}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Weekly Availability
          </CardTitle>
          <CardDescription>
            Times when this tutor is available for sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {availability.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              This tutor has not set their availability yet.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {availByDay
                .filter((d) => d.slots.length > 0)
                .map(({ day, slots }) => (
                  <div
                    key={day}
                    className="flex flex-col gap-2 rounded-lg border border-border/60 p-3 sm:flex-row sm:items-center sm:gap-4"
                  >
                    <span className="text-sm font-medium text-foreground sm:w-24">
                      {day}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {slots.map((slot) => (
                        <Badge
                          key={slot.id}
                          variant="secondary"
                          className="text-xs"
                        >
                          {slot.start_time.slice(0, 5)} -{" "}
                          {slot.end_time.slice(0, 5)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {currentUserRole === "tutor" &&
        currentTutorId !== id &&
        currentTutorId && (
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Tutor Peer Review
              </CardTitle>
              <CardDescription>
                Leave constructive feedback for this tutor to help them improve.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">Write a Peer Review</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Peer Review for {name}</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-4 py-4">
                    <div className="flex flex-col gap-2">
                      <Label>Rating (1-5)</Label>
                      <Input
                        type="number"
                        min={1}
                        max={5}
                        value={reviewRating}
                        onChange={(e) =>
                          setReviewRating(parseInt(e.target.value))
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Constructive Feedback</Label>
                      <Textarea
                        rows={4}
                        value={reviewFeedback}
                        onChange={(e) => setReviewFeedback(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setReviewOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handlePeerReview} disabled={reviewLoading}>
                      Submit Review
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
