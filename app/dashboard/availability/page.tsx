/** Availability page -- tutors manage weekly schedule slots and bio. */
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Plus, Trash2, Loader2, Save, Copy } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { DEMO_USERS } from "@/scripts/demo";
import type { TutorAvailability, Tutor } from "@/lib/types";
import { DAYS_OF_WEEK } from "@/lib/types";
import { ensureTutor } from "@/app/dashboard/profile/actions";

export default function AvailabilityPage() {
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [slots, setSlots] = useState<TutorAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bio, setBio] = useState("");

  // New slot form
  const [newDay, setNewDay] = useState("1");
  const [newStart, setNewStart] = useState("09:00");
  const [newEnd, setNewEnd] = useState("10:00");

  // Copy schedule form
  const [copyOpen, setCopyOpen] = useState(false);
  const [copyFromDay, setCopyFromDay] = useState("1");
  const [copyToDays, setCopyToDays] = useState<string[]>([]);
  const [copyLoading, setCopyLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Support demo mode - use seeded tutor profile ID
      const userId = user?.id || DEMO_USERS.tutor.profileId;

      if (user) {
        await ensureTutor();
      }

      const { data: tutorData } = await supabase
        .from("tutors")
        .select("id, bio")
        .eq("user_id", userId)
        .maybeSingle();

      if (tutorData) {
        setTutor(tutorData as Tutor);
        setBio(tutorData.bio || "");
        const { data: slotsData } = await supabase
          .from("tutor_availability")
          .select("id, tutor_id, day_of_week, start_time, end_time")
          .eq("tutor_id", tutorData.id)
          .order("day_of_week");
        setSlots((slotsData || []) as TutorAvailability[]);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function addSlot() {
    if (!tutor) return;
    const supabase = createClient();

    const { data, error } = await supabase
      .from("tutor_availability")
      .insert({
        tutor_id: tutor.id,
        day_of_week: parseInt(newDay),
        start_time: newStart,
        end_time: newEnd,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to add slot");
    } else if (data) {
      setSlots((prev: any) =>
        [...prev, data].sort((a: any, b: any) => a.day_of_week - b.day_of_week),
      );
      toast.success("Availability slot added");
    }
  }

  async function removeSlot(id: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("tutor_availability")
      .delete()
      .eq("id", id);

    if (!error) {
      setSlots((prev: any) => prev.filter((s: any) => s.id !== id));
      toast.success("Slot removed");
    }
  }

  async function copySchedule() {
    if (!tutor || copyToDays.length === 0) return;
    setCopyLoading(true);
    const supabase = createClient();
    const sourceSlots = slots.filter(
      (s) => s.day_of_week === parseInt(copyFromDay),
    );

    if (sourceSlots.length === 0) {
      toast.error("No slots to copy from the selected day.");
      setCopyLoading(false);
      return;
    }

    const newSlots = [];
    for (const targetDay of copyToDays) {
      const dayNum = parseInt(targetDay);
      for (const slot of sourceSlots) {
        // avoid exact duplicates
        const exists = slots.some(
          (s) =>
            s.day_of_week === dayNum &&
            s.start_time === slot.start_time &&
            s.end_time === slot.end_time,
        );
        if (!exists) {
          newSlots.push({
            tutor_id: tutor.id,
            day_of_week: dayNum,
            start_time: slot.start_time,
            end_time: slot.end_time,
          });
        }
      }
    }

    if (newSlots.length === 0) {
      toast.info("No new slots needed (already identical).");
      setCopyOpen(false);
      setCopyLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("tutor_availability")
      .insert(newSlots)
      .select();

    if (error) {
      toast.error("Failed to copy schedule");
    } else if (data) {
      setSlots((prev: any) =>
        [...prev, ...data].sort(
          (a: any, b: any) => a.day_of_week - b.day_of_week,
        ),
      );
      toast.success("Schedule copied successfully");
      setCopyOpen(false);
      setCopyToDays([]);
    }
    setCopyLoading(false);
  }

  async function saveBio() {
    if (!tutor) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("tutors")
      .update({ bio })
      .eq("id", tutor.id);

    if (error) {
      toast.error("Failed to update bio");
    } else {
      toast.success("Bio updated");
    }
    setSaving(false);
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
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <p className="max-w-md text-center text-sm text-muted-foreground">
          We could not load your tutor record yet. Open Profile to finish setup,
          then return here.
        </p>
        <Button asChild>
          <Link href="/dashboard/profile">Go to Profile</Link>
        </Button>
      </div>
    );
  }

  const groupedSlots = DAYS_OF_WEEK.map((day, idx) => ({
    day,
    idx,
    slots: slots.filter((s: any) => s.day_of_week === idx),
  }));

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Manage Availability
        </h1>
        <p className="text-muted-foreground">
          Set your weekly schedule and profile bio.
        </p>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Tutor Bio</CardTitle>
          <CardDescription>
            Tell learners about yourself and your teaching style.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="I specialize in making complex topics simple..."
            rows={3}
          />
          <Button
            onClick={saveBio}
            disabled={saving}
            size="sm"
            className="w-fit"
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Bio
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Add Availability Slot
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex flex-col gap-2 flex-1">
              <Label>Day</Label>
              <Select value={newDay} onValueChange={setNewDay}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day, idx) => (
                    <SelectItem key={idx} value={idx.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Start</Label>
              <Input
                type="time"
                value={newStart}
                onChange={(e) => setNewStart(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>End</Label>
              <Input
                type="time"
                value={newEnd}
                onChange={(e) => setNewEnd(e.target.value)}
              />
            </div>
            <Button onClick={addSlot}>
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Your Weekly Schedule</CardTitle>
            <CardDescription>Your current availability slots</CardDescription>
          </div>
          <Dialog open={copyOpen} onOpenChange={setCopyOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Copy className="mr-2 h-4 w-4" />
                Copy Day
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Copy Schedule</DialogTitle>
                <DialogDescription>
                  Copy time slots from one day to multiple other days.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-4">
                <div className="flex flex-col gap-2">
                  <Label>Copy from:</Label>
                  <Select value={copyFromDay} onValueChange={setCopyFromDay}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map((day, idx) => (
                        <SelectItem key={idx} value={idx.toString()}>
                          {day} (
                          {slots.filter((s) => s.day_of_week === idx).length}{" "}
                          slots)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2 mt-2">
                  <Label>Paste to:</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {DAYS_OF_WEEK.map((day, idx) => {
                      if (idx.toString() === copyFromDay) return null;
                      return (
                        <div key={idx} className="flex items-center space-x-2">
                          <Checkbox
                            id={`day-${idx}`}
                            checked={copyToDays.includes(idx.toString())}
                            onCheckedChange={(checked) => {
                              if (checked)
                                setCopyToDays((prev) => [
                                  ...prev,
                                  idx.toString(),
                                ]);
                              else
                                setCopyToDays((prev) =>
                                  prev.filter((d) => d !== idx.toString()),
                                );
                            }}
                          />
                          <label
                            htmlFor={`day-${idx}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {day}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCopyOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={copySchedule}
                  disabled={copyLoading || copyToDays.length === 0}
                >
                  {copyLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "Copy Schedule"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {slots.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No availability slots set. Add some above.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {groupedSlots
                .filter((g) => g.slots.length > 0)
                .map(({ day, slots: daySlots }) => (
                  <div
                    key={day}
                    className="flex flex-col gap-2 rounded-lg border border-border/60 p-3 sm:flex-row sm:items-start sm:gap-4"
                  >
                    <span className="text-sm font-medium text-foreground sm:w-24 sm:pt-1">
                      {day}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {daySlots.map((slot: any) => (
                        <Badge
                          key={slot.id}
                          variant="secondary"
                          className="flex items-center gap-1.5 text-xs pr-1"
                        >
                          {slot.start_time.slice(0, 5)} -{" "}
                          {slot.end_time.slice(0, 5)}
                          <button
                            onClick={() => removeSlot(slot.id)}
                            className="ml-1 rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive"
                            aria-label="Remove slot"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
