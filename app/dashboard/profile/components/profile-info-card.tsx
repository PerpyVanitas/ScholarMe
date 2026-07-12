import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  Award,
  BookOpen,
  Star,
} from "lucide-react";
import type { Profile } from "@/lib/types";

interface ProfileInfoCardProps {
  profile: Profile;
  displayName: string;
  isTutor: boolean;
  formatDate: (dateStr: string | null | undefined) => string;
}

export function ProfileInfoCard({
  profile,
  displayName,
  isTutor,
  formatDate,
}: ProfileInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>
          Your personal details and account information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <User className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Full Name</p>
              <p className="text-sm text-muted-foreground">{displayName}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Phone Number</p>
              <p className="text-sm text-muted-foreground">
                {profile.phone_number || "Not set"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Birthday</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(profile.birthdate || profile.date_of_birth)}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Member Since</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(profile.created_at)}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Award className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Student ID Number</p>
              <p className="text-sm text-muted-foreground">
                {profile.membership_number || "Not set"}
              </p>
            </div>
          </div>
          {!isTutor && (
            <>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <BookOpen className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Degree Program</p>
                  <p className="text-sm text-muted-foreground">
                    {profile.degree_program || "Not set"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Star className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Year Level</p>
                  <p className="text-sm text-muted-foreground">
                    {profile.year_level || "Not set"}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
