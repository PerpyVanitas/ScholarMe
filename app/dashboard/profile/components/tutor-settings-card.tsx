import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Edit2, ShieldCheck } from "lucide-react";
import type { Specialization } from "@/lib/types";

interface TutorSettingsCardProps {
  tutorBio: string;
  hourlyRate: number | null;
  yearsExperience: number | null;
  specializations: Specialization[];
  setTutorSettingsOpen: (v: boolean) => void;
  setMasteryVerificationOpen: (v: boolean) => void;
}

export function TutorSettingsCard({
  tutorBio,
  hourlyRate,
  yearsExperience,
  specializations,
  setTutorSettingsOpen,
  setMasteryVerificationOpen,
}: TutorSettingsCardProps) {
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
