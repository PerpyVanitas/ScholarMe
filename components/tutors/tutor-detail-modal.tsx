"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, Mail, BookOpen, MessageSquare } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface TutorDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tutor: {
    id: string;
    profile_id: string;
    bio: string | null;
    hourly_rate: number | null;
    years_experience: number | null;
    rating: number;
    total_ratings: number;
    profiles: {
      full_name: string;
      email: string;
      avatar_url: string | null;
      phone_number: string | null;
    };
    tutor_specializations: Array<{
      specializations: {
        id: string;
        name: string;
      };
    }>;
  };
}

export function TutorDetailModal({ open, onOpenChange, tutor }: TutorDetailModalProps) {
  const [hasBooked, setHasBooked] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  // Check if user has booked this tutor
  useEffect(() => {
    if (!open) return;

    const checkBookingHistory = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
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
      }
    };

    checkBookingHistory();
  }, [open, tutor.id, supabase]);

  const getAvatarUrl = (avatarUrl: string | null | undefined) => {
    if (!avatarUrl) return undefined;
    if (avatarUrl.startsWith("avatars/")) {
      return `/api/avatar?pathname=${encodeURIComponent(avatarUrl)}`;
    }
    return avatarUrl;
  };

  const specs = tutor.tutor_specializations
    .map(ts => ts.specializations?.name)
    .filter(Boolean);

  const initials = tutor.profiles.full_name
    .split(" ")
    .map(n => n[0])
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
              <AvatarImage src={getAvatarUrl(tutor.profiles.avatar_url)} alt={tutor.profiles.full_name} />
              <AvatarFallback className="text-lg bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-semibold">{tutor.profiles.full_name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Star className="h-4 w-4 fill-accent text-accent" />
                <span className="text-sm text-muted-foreground">
                  {tutor.rating > 0 ? tutor.rating.toFixed(1) : "New"}{" "}
                  {tutor.total_ratings > 0 && `(${tutor.total_ratings})`}
                </span>
              </div>
            </div>
          </div>

          {/* Bio */}
          {tutor.bio && (
            <div className="space-y-2">
              <p className="text-sm font-medium">About</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{tutor.bio}</p>
            </div>
          )}

          {/* Experience & Rate */}
          <div className="grid grid-cols-2 gap-4">
            {tutor.years_experience && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase">Experience</p>
                <p className="text-sm font-semibold">{tutor.years_experience} years</p>
              </div>
            )}
            {tutor.hourly_rate && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase">Rate</p>
                <p className="text-sm font-semibold">${tutor.hourly_rate}/hour</p>
              </div>
            )}
          </div>

          {/* Specializations */}
          {specs.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Specializations</p>
              <div className="flex flex-wrap gap-2">
                {specs.map(spec => (
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
            <a href={`mailto:${tutor.profiles.email}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
              <Mail className="h-4 w-4" />
              {tutor.profiles.email}
            </a>
            {tutor.profiles.phone_number && (
              <a href={`tel:${tutor.profiles.phone_number}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                <MessageSquare className="h-4 w-4" />
                {tutor.profiles.phone_number}
              </a>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-2 flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href={`/dashboard/sessions?book=${tutor.id}`}>
                <BookOpen className="mr-2 h-4 w-4" />
                Book Session
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
