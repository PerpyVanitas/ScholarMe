"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, MentorshipPreference } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { MessageSquare, Users, Sparkles, UserCheck } from "lucide-react";
import { getAvatarUrl } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";
import { MentorshipRoadmap } from "./mentorship-roadmap";

interface MentorshipClientProps {
  profile: Profile;
  initialPref: MentorshipPreference | null;
  initialMatches: Array<{
    id: string;
    full_name: string;
    avatar_url: string | null;
    degree_program: string | null;
    year_level: number | null;
    bio: string | null;
  }>;
  isSenior: boolean;
}

export function MentorshipClient({
  profile,
  initialPref,
  initialMatches,
  isSenior,
}: MentorshipClientProps) {
  const supabase = createClient();
  const [isActive, setIsActive] = useState(initialPref ? initialPref.is_active : true);
  const [roleType, setRoleType] = useState<"mentor" | "mentee" | "both">(
    initialPref ? initialPref.role_type : isSenior ? "mentor" : "mentee"
  );
  const [matches] = useState(initialMatches);

  const handleToggleActive = async (checked: boolean) => {
    setIsActive(checked);
    try {
      const { error } = await supabase.from("mentorship_preferences").upsert({
        user_id: profile.id,
        role_type: roleType,
        is_active: checked,
      });

      if (error) throw error;
      toast.success(
        checked
          ? "Opted into Mentorship Matching!"
          : "Opted out of Mentorship Matching pool."
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update preferences";
      toast.error(msg);
      setIsActive(!checked);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mentorship Goal Roadmap & Milestones */}
      <MentorshipRoadmap />

      {/* Matching Pool */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" /> Honor Society Mentorship Matching
          </h2>
          <p className="text-sm text-muted-foreground">
            Connect with experienced senior members or guide new members on navigating committees and org life.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-muted/40 p-2.5 rounded-lg border">
          <Switch checked={isActive} onCheckedChange={handleToggleActive} />
          <span className="text-xs font-semibold">
            {isActive ? "Active in Mentorship Pool" : "Opted Out"}
          </span>
        </div>
      </div>

      {!isActive ? (
        <Card className="bg-muted/40 p-8 text-center text-muted-foreground space-y-2">
          <Users className="h-8 w-8 mx-auto text-muted-foreground/60" />
          <p className="font-semibold text-foreground">You are currently opted out of Mentorship Matching</p>
          <p className="text-xs max-w-md mx-auto">
            Toggle the switch above to rejoin the mentorship pool and connect with senior guides or mentees. (Your Study Buddy status is unaffected).
          </p>
        </Card>
      ) : matches.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No mentorship matches currently available for your tenure criteria.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((match) => (
            <Card key={match.id} className="overflow-hidden flex flex-col shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarImage src={getAvatarUrl(match.avatar_url)} />
                    <AvatarFallback>{match.full_name?.charAt(0) || "?"}</AvatarFallback>
                  </Avatar>
                  <Badge variant={isSenior ? "outline" : "default"} className="text-xs">
                    {isSenior ? `Mentee (Year ${match.year_level})` : `Mentor (Year ${match.year_level})`}
                  </Badge>
                </div>
                <CardTitle className="mt-3 text-lg">{match.full_name}</CardTitle>
                <CardDescription className="truncate text-xs">
                  {match.degree_program || "CIT-U Scholar"}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 text-xs text-muted-foreground">
                <p className="line-clamp-3">{match.bio || "No summary provided yet."}</p>
              </CardContent>

              <CardFooter className="pt-3 border-t bg-muted/20">
                <Button asChild className="w-full gap-2 text-xs" size="sm">
                  <Link href={`/dashboard/messages?new=${match.id}`}>
                    <MessageSquare className="h-3.5 w-3.5" /> Start Conversation
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
