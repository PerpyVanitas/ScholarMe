/**
 * ==========================================================================
 * AVAILABILITY PAGE - Tutor Schedule Management
 * ==========================================================================
 *
 * PURPOSE: Allows tutors to manage their weekly availability and bio.
 * Only accessible to users with the "tutor" role.
 *
 * SECTIONS:
 * 1. BIO EDITOR: Edit the tutor's self-description (saved to tutors.bio)
 * 2. ADD SLOT: Form to add a new availability slot (day + start/end time)
 * 3. WEEKLY SCHEDULE: Shows all current slots grouped by day, with delete buttons
 *
 * DATA OPERATIONS:
 * - Slots are stored in the tutor_availability table
 * - Adding a slot: INSERT into tutor_availability (real-time, no page reload)
 * - Removing a slot: DELETE from tutor_availability
 * - Saving bio: UPDATE tutors.bio
 *
 * IMPORTANT: If a user with tutor role doesn't have a tutors record,
 * a "Tutor Profile Not Found" error state is shown. The admin needs to
 * create the tutor record (happens automatically when admin creates a tutor user).
 *
 * ROUTE: /dashboard/availability
 * ==========================================================================
 */
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Plus, Trash2, Loader2, Save, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { TutorAvailability, Tutor } from "@/lib/types";
import { DAYS_OF_WEEK } from "@/lib/types";

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

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: tutorData } = await supabase
        .from("tutors")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (tutorData) {
        setTutor(tutorData);
        setBio(tutorData.bio || "");
        const { data: slotsData } = await supabase
          .from("tutor_availability")
          .select("*")
          .eq("tutor_id", tutorData.id)
          .order("day_of_week");
        setSlots(slotsData || []);
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
      setSlots((prev) => [...prev, data].sort((a, b) => a.day_of_week - b.day_of_week));
      toast.success("Availability slot added");
    }
  }

  async function removeSlot(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("tutor_availability").delete().eq("id", id);

    if (!error) {
      setSlots((prev) => prev.filter((s) => s.id !== id));
      toast.success("Slot removed");
    }
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
        <div className="rounded-full bg-warning/10 p-4">
          <AlertCircle className="h-8 w-8 text-warning-foreground" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Tutor Profile Not Found</h2>
        <p className="max-w-md text-center text-sm text-muted-foreground">
          Your tutor profile has not been created yet. Please contact your administrator.
        </p>
      </div>
    );
  }

  const groupedSlots = DAYS_OF_WEEK.map((day, idx) => ({
    day,
    idx,
    slots: slots.filter((s) => s.day_of_week === idx),
  }));

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Manage Availability</h1>
        <p className="text-muted-foreground">Set your weekly schedule and profile bio.</p>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Tutor Bio</CardTitle>
          <CardDescription>Tell learners about yourself and your teaching style.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="I specialize in making complex topics simple..."
            rows={3}
          />
          <Button onClick={saveBio} disabled={saving} size="sm" className="w-fit">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
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
              <Input type="time" value={newStart} onChange={(e) => setNewStart(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>End</Label>
              <Input type="time" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} />
            </div>
            <Button onClick={addSlot}>
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Your Weekly Schedule</CardTitle>
          <CardDescription>Your current availability slots</CardDescription>
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
                  <div key={day} className="flex flex-col gap-2 rounded-lg border border-border/60 p-3 sm:flex-row sm:items-start sm:gap-4">
                    <span className="text-sm font-medium text-foreground sm:w-24 sm:pt-1">{day}</span>
                    <div className="flex flex-wrap gap-2">
                      {daySlots.map((slot) => (
                        <Badge
                          key={slot.id}
                          variant="secondary"
                          className="flex items-center gap-1.5 text-xs pr-1"
                        >
                          {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
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
