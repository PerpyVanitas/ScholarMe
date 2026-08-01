/** Availability page -- tutors manage weekly schedule slots and bio. */
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { DEMO_USERS } from "@/scripts/demo";
import type { TutorAvailability, Tutor } from "@/lib/types";
import { ensureTutor } from "@/app/dashboard/profile/actions";
import { TutorBioCard } from "./components/tutor-bio-card";
import { AddSlotCard } from "./components/add-slot-card";
import { WeeklyScheduleCard } from "./components/weekly-schedule-card";
import { CopyScheduleDialog } from "./components/copy-schedule-dialog";

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
      setSlots((prev: TutorAvailability[]) =>
        [...prev, data as TutorAvailability].sort((a, b) => a.day_of_week - b.day_of_week),
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
      setSlots((prev) => prev.filter((s) => s.id !== id));
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
      setSlots((prev) =>
        [...prev, ...(data as TutorAvailability[])].sort(
          (a, b) => a.day_of_week - b.day_of_week,
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

      <TutorBioCard
        bio={bio}
        onChangeBio={setBio}
        onSaveBio={saveBio}
        saving={saving}
      />

      <AddSlotCard
        newDay={newDay}
        setNewDay={setNewDay}
        newStart={newStart}
        setNewStart={setNewStart}
        newEnd={newEnd}
        setNewEnd={setNewEnd}
        onAddSlot={addSlot}
      />

      <WeeklyScheduleCard
        slots={slots}
        onOpenCopy={() => setCopyOpen(true)}
        onRemoveSlot={removeSlot}
      />

      <CopyScheduleDialog
        open={copyOpen}
        onOpenChange={setCopyOpen}
        copyFromDay={copyFromDay}
        setCopyFromDay={setCopyFromDay}
        copyToDays={copyToDays}
        setCopyToDays={setCopyToDays}
        copyLoading={copyLoading}
        slots={slots}
        onCopySchedule={copySchedule}
      />
    </div>
  );
}
