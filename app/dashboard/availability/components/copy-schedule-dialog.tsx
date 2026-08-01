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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { DAYS_OF_WEEK, type TutorAvailability } from "@/lib/types";

interface CopyScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  copyFromDay: string;
  setCopyFromDay: (val: string) => void;
  copyToDays: string[];
  setCopyToDays: React.Dispatch<React.SetStateAction<string[]>>;
  copyLoading: boolean;
  slots: TutorAvailability[];
  onCopySchedule: () => void;
}

export function CopyScheduleDialog({
  open,
  onOpenChange,
  copyFromDay,
  setCopyFromDay,
  copyToDays,
  setCopyToDays,
  copyLoading,
  slots,
  onCopySchedule,
}: CopyScheduleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                    {day} ({slots.filter((s) => s.day_of_week === idx).length} slots)
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
                          setCopyToDays((prev) => [...prev, idx.toString()]);
                        else
                          setCopyToDays((prev) =>
                            prev.filter((d) => d !== idx.toString())
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onCopySchedule}
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
  );
}
