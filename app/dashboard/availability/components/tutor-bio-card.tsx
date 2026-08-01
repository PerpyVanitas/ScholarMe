"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save } from "lucide-react";

interface TutorBioCardProps {
  bio: string;
  onChangeBio: (val: string) => void;
  onSaveBio: () => void;
  saving: boolean;
}

export function TutorBioCard({ bio, onChangeBio, onSaveBio, saving }: TutorBioCardProps) {
  return (
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
          onChange={(e) => onChangeBio(e.target.value)}
          placeholder="I specialize in making complex topics simple..."
          rows={3}
        />
        <Button
          onClick={onSaveBio}
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
  );
}
