import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit2, Star, Github, Linkedin } from "lucide-react";
import { getAvatarUrl } from "@/lib/utils";
import { getLevelColor, getLevelTitle } from "@/lib/utils/gamification";
import type { Profile, Specialization } from "@/lib/types";

interface ProfileHeaderProps {
  profile: Profile;
  displayName: string;
  roleName: string;
  specializations: Specialization[];
  openEditModal: () => void;
  getInitials: (name: string) => string;
}

export function ProfileHeader({
  profile,
  displayName,
  roleName,
  specializations,
  openEditModal,
  getInitials,
}: ProfileHeaderProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <Avatar
            className={`h-24 w-24 border-4 shadow-lg ${getLevelColor(profile.current_level || 1)}`}
          >
            <AvatarImage
              src={getAvatarUrl(profile.avatar_url)}
              alt={displayName}
            />
            <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className="text-2xl font-bold">
                {displayName}
                {profile.pronouns && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({profile.pronouns})
                  </span>
                )}
              </h1>
              <Badge
                variant="secondary"
                className="w-fit mx-auto sm:mx-0 capitalize"
              >
                {roleName}
              </Badge>
              <Badge
                className={`w-fit mx-auto sm:mx-0 ${getLevelColor(profile.current_level || 1)}`}
              >
                Level {profile.current_level || 1} •{" "}
                {getLevelTitle(profile.current_level || 1)}
              </Badge>
            </div>
            <p className="text-muted-foreground">{profile.email}</p>
            {profile.status_message && (
              <p className="text-sm italic text-foreground/80 mt-1">
                "{profile.status_message}"
              </p>
            )}

            <div className="flex items-center justify-center sm:justify-start gap-4 mt-2">
              {profile.social_links?.github && (
                <a
                  href={profile.social_links.github}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Github className="h-5 w-5" />
                </a>
              )}
              {profile.social_links?.linkedin && (
                <a
                  href={profile.social_links.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
              )}
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 text-sm font-medium">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-primary">
                {profile.total_xp || 0} XP Total
              </span>
            </div>

            {specializations.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-2">
                {specializations.map((spec) => (
                  <Badge key={spec.id} variant="outline">
                    {spec.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Button onClick={openEditModal} variant="outline" className="gap-2">
            <Edit2 className="h-4 w-4" />
            Edit Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
