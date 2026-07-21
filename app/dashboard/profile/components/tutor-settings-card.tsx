import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Edit2, ShieldCheck, PauseCircle, PlayCircle, Loader2 } from "lucide-react";
import type { Specialization } from "@/lib/types";
import { Switch } from "@/components/ui/switch";
import { useState, useTransition } from "react";
import { toggleTutorPause } from "../actions";
import { toast } from "sonner";

interface TutorSettingsCardProps {
  tutorBio: string;
  hourlyRate: number | null;
  yearsExperience: number | null;
  specializations: Specialization[];
  isPaused: boolean;
  setIsPaused: (v: boolean) => void;
  setTutorSettingsOpen: (v: boolean) => void;
  setMasteryVerificationOpen: (v: boolean) => void;
}

export function TutorSettingsCard({
  tutorBio,
  hourlyRate,
  yearsExperience,
  specializations,
  isPaused,
  setIsPaused,
  setTutorSettingsOpen,
  setMasteryVerificationOpen,
}: TutorSettingsCardProps) {
  const [isPending, startTransition] = useTransition();

  function handleTogglePause(checked: boolean) {
    setIsPaused(checked);
    startTransition(async () => {
      const res = await toggleTutorPause(checked);
      if (res.success) {
        toast.success(checked ? "Account paused" : "Account reactivated");
      } else {
        toast.error("Failed to update status");
        setIsPaused(!checked);
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Tutor Settings
          </CardTitle>
          <CardDescription>
            Manage your tutoring profile and specializations
          </CardDescription>
        </div>
        <Button
          onClick={() => setTutorSettingsOpen(true)}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Edit2 className="h-4 w-4" />
          Edit
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/30">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Pause Account</label>
              {isPending && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
            </div>
            <p className="text-sm text-muted-foreground">
              Temporarily hide your profile from search results and stop accepting new sessions.
            </p>
          </div>
          <Switch
            checked={isPaused}
            onCheckedChange={handleTogglePause}
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Bio</p>
          <p className="text-sm text-muted-foreground">
            {tutorBio || "Not set"}
          </p>
        </div>
        {hourlyRate && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Hourly Rate</p>
            <p className="text-sm text-muted-foreground">${hourlyRate}/hour</p>
          </div>
        )}
        {yearsExperience && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Years of Experience</p>
            <p className="text-sm text-muted-foreground">
              {yearsExperience} years
            </p>
          </div>
        )}
        {specializations.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Specializations</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMasteryVerificationOpen(true)}
              >
                <ShieldCheck className="mr-2 h-3.5 w-3.5" />
                Verify Mastery
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {specializations.map((spec) => (
                <Badge key={spec.id} variant="secondary">
                  {spec.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
