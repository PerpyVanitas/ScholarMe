import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export function SessionForm({ onSuccess, onCancel }: { onSuccess: () => void, onCancel: () => void }) {
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isOfficeHours, setIsOfficeHours] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState(5);
  const [topic, setTopic] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !startTime || !endTime) return;
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: tutor } = await supabase.from("tutors").select("id").eq("user_id", user.id).single();
      if (!tutor) throw new Error("Tutor profile not found");

      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tutor_id: tutor.id,
          learner_id: user.id, // For open sessions, host is learner_id
          scheduled_date: date,
          start_time: startTime,
          end_time: endTime,
          status: "confirmed",
          max_participants: isOfficeHours ? 50 : maxParticipants,
          is_office_hours: isOfficeHours,
          tutor_notes: topic,
        }),
      });

      if (res.ok) {
        toast.success(isOfficeHours ? "Office hours scheduled" : "Session scheduled");
        onSuccess();
      } else {
        toast.error("Failed to schedule session");
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: unknown) {
      // @ts-ignore: Strict unknown type check
      toast.error(e.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="flex items-center space-x-2 bg-primary/5 p-3 rounded-md border border-primary/20">
        <Switch id="office-hours" checked={isOfficeHours} onCheckedChange={setIsOfficeHours} />
        <Label htmlFor="office-hours" className="font-semibold cursor-pointer">Host Office Hours (Drop-in)</Label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="topic">Topic / Subject</Label>
          <Input id="topic" placeholder="e.g. Calculus Help" value={topic} onChange={(e) => setTopic(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start">Start Time</Label>
          <Input id="start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end">End Time</Label>
          <Input id="end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
        </div>
      </div>

      {!isOfficeHours && (
        <div className="space-y-2">
          <Label htmlFor="max-participants">Max Participants</Label>
          <Input id="max-participants" type="number" min="1" max="10" value={maxParticipants} onChange={(e) => setMaxParticipants(parseInt(e.target.value))} />
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Schedule
        </Button>
      </div>
    </form>
  );
}
