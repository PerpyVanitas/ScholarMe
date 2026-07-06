"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface TutorSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tutorBio: string;
  setTutorBio: (v: string) => void;
  hourlyRate: number | null;
  setHourlyRate: (v: number | null) => void;
  yearsExperience: number | null;
  setYearsExperience: (v: number | null) => void;
  savingTutor: boolean;
  handleSaveTutorSettings: () => void;
}

export function TutorSettingsDialog({
  open,
  onOpenChange,
  tutorBio,
  setTutorBio,
  hourlyRate,
  setHourlyRate,
  yearsExperience,
  setYearsExperience,
  savingTutor,
  handleSaveTutorSettings,
}: TutorSettingsDialogProps) {
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
            <Label htmlFor="tutorBio">Bio</Label>
            <textarea
              id="tutorBio"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={tutorBio}
              onChange={(e) => setTutorBio(e.target.value)}
              placeholder="Tell students about your expertise..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
              <Input
                id="hourlyRate"
                type="number"
                value={hourlyRate || ""}
                onChange={(e) =>
                  setHourlyRate(e.target.value ? Number(e.target.value) : null)
                }
                placeholder="e.g. 50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yearsExperience">Years of Experience</Label>
              <Input
                id="yearsExperience"
                type="number"
                value={yearsExperience || ""}
                onChange={(e) =>
                  setYearsExperience(
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                placeholder="e.g. 5"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={savingTutor}
          >
            Cancel
          </Button>
          <Button onClick={handleSaveTutorSettings} disabled={savingTutor}>
            {savingTutor ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
