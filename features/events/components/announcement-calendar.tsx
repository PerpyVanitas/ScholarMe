"use client";

import { useState } from "react";
import { format, isSameDay, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  Download,
  Plus,
} from "lucide-react";
import { FacilityEvent, RsvpStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/user-context";
import {
  updateEventRsvp,
  deleteEvent,
  createEvent,
} from "@/features/events/api/actions";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AnnouncementCalendarProps {
  initialEvents: FacilityEvent[];
}

export function AnnouncementCalendar({
  initialEvents,
}: AnnouncementCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { profile, role } = useUser();
  const isAdmin =
    role === "administrator" ||
    role === "super_admin" ||
    [
      "president",
      "vice_president",
      "secretary",
      "treasurer",
      "auditor",
      "committee_head",
      "assistant_committee_head",
    ].includes(role as string);

  // Create Event State
  const [openCreate, setOpenCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("12:00");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("13:00");
  const [isMandatory, setIsMandatory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterType, setFilterType] = useState<
    "all" | "mandatory" | "voluntary"
  >("all");

  // Filter events for the selected day
  const selectedDayEvents = initialEvents.filter((event) => {
    if (!date) return false;
    const isDateMatch = isSameDay(parseISO(event.start_time), date);
    if (!isDateMatch) return false;

    if (filterType === "mandatory") return event.is_mandatory;
    if (filterType === "voluntary") return !event.is_mandatory;
    return true;
  });

  // Highlight days with events
  const modifiers = {
    hasEvent: initialEvents.map((e) => parseISO(e.start_time)),
  };

  const modifiersStyles = {
    hasEvent: { fontWeight: "bold", border: "2px solid currentColor" },
  };

  const handleRsvp = async (eventId: string, status: RsvpStatus) => {
    try {
      await updateEventRsvp(eventId, status);
      toast.success(`RSVP updated to ${status}`);
    } catch (e: unknown) {
      // @ts-ignore: Strict unknown type check
      toast.error("Failed to RSVP: " + e.message);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startDate || !startTime || !endDate || !endTime) return;
    setSubmitting(true);
    try {
      const startIso = new Date(`${startDate}T${startTime}:00`).toISOString();
      const endIso = new Date(`${endDate}T${endTime}:00`).toISOString();

      await createEvent({
        title,
        description,
        start_time: startIso,
        end_time: endIso,
        color_code: "bg-blue-500", // Default color
        is_mandatory: isMandatory,
      });
      toast.success("Event created!");
      setOpenCreate(false);
    } catch (e: unknown) {
      // @ts-ignore: Strict unknown type check
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEvent(id);
      toast.success("Event deleted");
    } catch (e: unknown) {
      // @ts-ignore: Strict unknown type check
      toast.error("Failed to delete event: " + e.message);
    }
  };

  const downloadICS = (event: FacilityEvent) => {
    const formatDateForIcs = (dateString: string) => {
      const date = parseISO(dateString);
      return format(date, "yyyyMMdd'T'HHmmss'Z'");
    };

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${event.title}
DESCRIPTION:${event.description || ""}
DTSTART:${formatDateForIcs(event.start_time)}
DTEND:${formatDateForIcs(event.end_time)}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], {
      type: "text/calendar;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${event.title.replace(/ /g, "_")}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
      <Card className="md:col-span-4 lg:col-span-3 flex flex-col items-center pt-4">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md border"
          modifiers={modifiers}
          modifiersStyles={modifiersStyles}
        />
        {isAdmin && (
          <div className="p-4 w-full border-t mt-4">
            <Dialog open={openCreate} onOpenChange={setOpenCreate}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Event</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <Input
                    placeholder="Event Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                  <Textarea
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium">Start Date</label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Start Time</label>
                      <Input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium">End Date</label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium">End Time</label>
                      <Input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="mandatory"
                      checked={isMandatory}
                      onCheckedChange={(c) => setIsMandatory(!!c)}
                    />
                    <label htmlFor="mandatory" className="text-sm font-medium">
                      Mandatory Attendance
                    </label>
                  </div>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full"
                  >
                    {submitting ? "Saving..." : "Create Event"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </Card>

      <div className="md:col-span-8 lg:col-span-9 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Interactive Calendar
            </h2>
            <p className="text-muted-foreground">
              {date
                ? `Events for ${format(date, "MMMM do, yyyy")}`
                : "Select a date to view events"}
            </p>
          </div>

          <Select
            value={filterType}
            // @ts-ignore: Strict unknown type check
            onValueChange={(val: unknown) => setFilterType(val)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter events" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="mandatory">Mandatory Only</SelectItem>
              <SelectItem value="voluntary">Voluntary Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedDayEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg border-dashed">
            <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-lg font-medium">No events scheduled</h3>
            <p className="text-muted-foreground text-sm mt-1">
              There are no events for this day.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {selectedDayEvents.map((event) => {
              const myRsvp = event.event_rsvps?.find(
                (r) => r.profile_id === profile?.id,
              );
              const goingCount =
                event.event_rsvps?.filter((r) => r.status === "going").length ||
                0;
              const isBgColor = event.color_code?.startsWith("bg-")
                ? event.color_code
                : "bg-blue-500";

              return (
                <Card
                  key={event.id}
                  className="overflow-hidden border-l-4"
                  style={{ borderLeftColor: "var(--primary)" }}
                >
                  <div className={`w-full h-1 ${isBgColor}`} />
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start gap-4">
                      <CardTitle className="text-lg">{event.title}</CardTitle>
                      {event.is_mandatory && (
                        <Badge variant="destructive">Mandatory</Badge>
                      )}
                    </div>
                    <CardDescription className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {format(parseISO(event.start_time), "h:mm a")} -{" "}
                        {format(parseISO(event.end_time), "h:mm a")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" /> {goingCount} going
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {event.description || "No description provided."}
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t bg-muted/20 p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium mr-2">RSVP:</span>
                      <Button
                        variant={
                          myRsvp?.status === "going" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => handleRsvp(event.id, "going")}
                      >
                        Going
                      </Button>
                      <Button
                        variant={
                          myRsvp?.status === "maybe" ? "secondary" : "outline"
                        }
                        size="sm"
                        onClick={() => handleRsvp(event.id, "maybe")}
                      >
                        Maybe
                      </Button>
                      <Button
                        variant={
                          myRsvp?.status === "not_going"
                            ? "destructive"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => handleRsvp(event.id, "not_going")}
                      >
                        Not Going
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadICS(event)}
                      >
                        <Download className="w-4 h-4 mr-2" /> .ics
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(event.id)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
