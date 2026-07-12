"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getAvatarUrl } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  Mail,
  BookOpen,
  MessageSquare,
  Github,
  Linkedin,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getTutorLastActive } from "@/app/dashboard/tutors/actions";
import { formatDistanceToNow } from "date-fns";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

interface TutorDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tutor: {
    id: string;
    user_id: string;
    profile_id?: string;
    bio: string | null;
    hourly_rate: number | null;
    years_experience: number | null;
    is_paused?: boolean;
    rating: number;
    total_ratings: number;
    profiles: {
      full_name: string;
      email: string;
      avatar_url: string | null;
      phone_number?: string | null;
      pronouns?: string | null;
      social_links?: Record<string, string> | null;
    };
    tutor_specializations: Array<{
      specializations: {
        id: string;
        name: string;
      };
    }>;
  };
}

export function TutorDetailModal({
  open,
  onOpenChange,
  tutor,
}: TutorDetailModalProps) {
  const [hasBooked, setHasBooked] = useState(false);
  const [lastActive, setLastActive] = useState<string | null>(null);
  const [isLoadingActive, setIsLoadingActive] = useState(true);
  const supabase = createClient();

  // Check if user has booked this tutor
  useEffect(() => {
    if (!open) return;

    const checkBookingHistory = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from("sessions")
          .select("id")
          .eq("learner_id", user.id)
          .eq("tutor_id", tutor.id)
          .maybeSingle();

        setHasBooked(!!data);
      } catch (error) {
        console.error("Error checking booking history:", error);
        toast.error(
          error instanceof Error ? error.message : "An error occurred",
        );
      }
    };

    const fetchLastActive = async () => {
      setIsLoadingActive(true);
      try {
        const date = await getTutorLastActive(tutor.user_id);
        setLastActive(date);
      } catch (e) {
        console.error("Error fetching last active date:", e);
        toast.error(e instanceof Error ? e.message : "An error occurred");
      } finally {
        setIsLoadingActive(false);
      }
    };

    checkBookingHistory();
    fetchLastActive();
  }, [open, tutor.user_id, tutor.id, supabase]);

  const specs = tutor.tutor_specializations
    .map((ts) => ts.specializations?.name)
    .filter(Boolean);

  const initials = tutor.profiles.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Tutor Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header with Avatar and Name */}
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={getAvatarUrl(tutor.profiles.avatar_url)}
                alt={tutor.profiles.full_name}
              />
              <AvatarFallback className="text-lg bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-semibold">
                {tutor.profiles.full_name}
                {tutor.profiles.pronouns && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({tutor.profiles.pronouns})
                  </span>
                )}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {tutor.is_paused && (
                  <Badge
                    variant="destructive"
                    className="font-normal text-xs uppercase tracking-wider"
                  >
                    On Leave
                  </Badge>
                )}
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-accent text-accent" />
                  <span className="text-sm text-muted-foreground">
                    {tutor.rating > 0 ? tutor.rating.toFixed(1) : "New"}{" "}
                    {tutor.total_ratings > 0 && `(${tutor.total_ratings})`}
                  </span>
                </div>
                <span className="text-muted-foreground/50 text-sm hidden sm:inline">
                  •
                </span>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {isLoadingActive ? (
                    <span className="animate-pulse">Checking status...</span>
                  ) : lastActive ? (
                    <span>
                      Active{" "}
                      {formatDistanceToNow(new Date(lastActive), {
                        addSuffix: true,
                      })}
                    </span>
                  ) : (
                    <span>Active recently</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          {tutor.bio && (
            <div className="space-y-2">
              <p className="text-sm font-medium">About</p>
              <div className="text-sm text-muted-foreground leading-relaxed prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{tutor.bio}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* Experience & Rate */}
          <div className="grid grid-cols-2 gap-4">
            {tutor.years_experience && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Experience
                </p>
                <p className="text-sm font-semibold">
                  {tutor.years_experience} years
                </p>
              </div>
            )}
            {tutor.hourly_rate && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Rate
                </p>
                <p className="text-sm font-semibold">
                  ${tutor.hourly_rate}/hour
                </p>
              </div>
            )}
          </div>

          {/* Specializations */}
          {specs.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Specializations</p>
              <div className="flex flex-wrap gap-2">
                {specs.map((spec) => (
                  <Badge key={spec} variant="secondary">
                    {spec}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Contact Info */}
          <div className="space-y-2 pt-2 border-t">
            <p className="text-sm font-medium">Contact</p>
            <a
              href={`mailto:${tutor.profiles.email}`}
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <Mail className="h-4 w-4" />
              {tutor.profiles.email}
            </a>
            {tutor.profiles.phone_number && (
              <a
                href={`tel:${tutor.profiles.phone_number}`}
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <MessageSquare className="h-4 w-4" />
                {tutor.profiles.phone_number}
              </a>
            )}
            {tutor.profiles.social_links?.github && (
              <a
                href={tutor.profiles.social_links.github}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
            )}
            {tutor.profiles.social_links?.linkedin && (
              <a
                href={tutor.profiles.social_links.linkedin}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </a>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-2 flex flex-col gap-2">
            <Button asChild className="w-full" disabled={tutor.is_paused}>
              <Link
                href={
                  tutor.is_paused ? "#" : `/dashboard/sessions?book=${tutor.id}`
                }
              >
                <BookOpen className="mr-2 h-4 w-4" />
                {tutor.is_paused ? "Currently Unavailable" : "Book Session"}
              </Link>
            </Button>

            {hasBooked && (
              <Button variant="outline" className="w-full">
                <Star className="mr-2 h-4 w-4" />
                Rate Tutor
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
