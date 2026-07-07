"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface TutorSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tutorId?: string | null;
  tutorBio: string;
  setTutorBio: (v: string) => void;
  hourlyRate: number | null;
  setHourlyRate: (v: number | null) => void;
  yearsExperience: number | null;
  setYearsExperience: (v: number | null) => void;
  isPaused: boolean;
  setIsPaused: (v: boolean) => void;
  calendarSyncEnabled: boolean;
  setCalendarSyncEnabled: (v: boolean) => void;
  autoApprovePastLearners: boolean;
  setAutoApprovePastLearners: (v: boolean) => void;
  savingTutor: boolean;
  handleSaveTutorSettings: () => void;
}

export function TutorSettingsDialog({
  open,
  onOpenChange,
  tutorId,
  tutorBio,
  setTutorBio,
  hourlyRate,
  setHourlyRate,
  yearsExperience,
  setYearsExperience,
  isPaused,
  setIsPaused,
  calendarSyncEnabled,
  setCalendarSyncEnabled,
  autoApprovePastLearners,
  setAutoApprovePastLearners,
  savingTutor,
  handleSaveTutorSettings,
}: TutorSettingsDialogProps) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const switchBase =
    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";
  const switchThumb =
    "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Tutor Settings</DialogTitle>
          <DialogDescription>
            Update your bio, rate, and specializations
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="tutorBio">Bio</Label>
              <span className="text-xs text-muted-foreground">
                Markdown supported
              </span>
            </div>
            <Textarea
              id="tutorBio"
              value={tutorBio}
              onChange={(e) => setTutorBio(e.target.value)}
              placeholder="Tell learners about your teaching style, background, and what they can expect..."
              className="h-32 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
              <Input
                id="hourlyRate"
                type="number"
                min="0"
                step="1"
                value={hourlyRate || ""}
                onChange={(e) =>
                  setHourlyRate(
                    e.target.value ? parseInt(e.target.value) : null,
                  )
                }
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yearsExperience">Years Experience</Label>
              <Input
                id="yearsExperience"
                type="number"
                min="0"
                step="1"
                value={yearsExperience || ""}
                onChange={(e) =>
                  setYearsExperience(
                    e.target.value ? parseInt(e.target.value) : null,
                  )
                }
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
              <div className="space-y-0.5">
                <Label>Vacation Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Temporarily hide your profile from search and prevent new
                  bookings.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  role="switch"
                  aria-checked={isPaused}
                  onClick={() => setIsPaused(!isPaused)}
                  className={`${switchBase} ${isPaused ? "bg-primary" : "bg-muted"}`}
                >
                  <span
                    className={`${switchThumb} ${isPaused ? "translate-x-5" : "translate-x-0"}`}
                  />
                </button>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Calendar Sync</Label>
                  <p className="text-sm text-muted-foreground">
                    Sync upcoming sessions to your Google/Outlook calendar.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={calendarSyncEnabled}
                    onClick={() => setCalendarSyncEnabled(!calendarSyncEnabled)}
                    className={`${switchBase} ${calendarSyncEnabled ? "bg-primary" : "bg-muted"}`}
                  >
                    <span
                      className={`${switchThumb} ${calendarSyncEnabled ? "translate-x-5" : "translate-x-0"}`}
                    />
                  </button>
                </div>
              </div>
              {calendarSyncEnabled && tutorId && (
                <div className="mt-3 pt-3 border-t">
                  <Label className="text-xs mb-1.5 block">
                    Calendar Subscription URL (.ics)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={`${origin}/api/calendar/${tutorId}`}
                      className="h-8 text-xs font-mono"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2 shrink-0"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `${origin}/api/calendar/${tutorId}`,
                        );
                        toast.success("Copied to clipboard");
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
              <div className="space-y-0.5">
                <Label>Auto-Approve Sessions</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically confirm bookings from learners you've tutored
                  before.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  role="switch"
                  aria-checked={autoApprovePastLearners}
                  onClick={() =>
                    setAutoApprovePastLearners(!autoApprovePastLearners)
                  }
                  className={`${switchBase} ${autoApprovePastLearners ? "bg-primary" : "bg-muted"}`}
                >
                  <span
                    className={`${switchThumb} ${autoApprovePastLearners ? "translate-x-5" : "translate-x-0"}`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveTutorSettings} disabled={savingTutor}>
            {savingTutor ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
