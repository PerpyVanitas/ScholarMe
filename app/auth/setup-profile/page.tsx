"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAvatarUrl } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GraduationCap, Camera, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { getRoleName } from "@/lib/utils/roles";
import { ensureProfile, ensureTutor } from "@/app/dashboard/profile/actions";

interface Specialization {
  id: string;
  name: string;
}

export default function SetupProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [roleName, setRoleName] = useState<string>("learner");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPathname, setAvatarPathname] = useState<string | null>(null); // Store actual Blob pathname

  // Form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [membershipNumber, setMembershipNumber] = useState("");
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [hourlyRate, setHourlyRate] = useState<number | "">("");
  const [yearsExperience, setYearsExperience] = useState<number | "">("");
  const [degreeProgram, setDegreeProgram] = useState("");
  const [yearLevel, setYearLevel] = useState<number | "">("");
  const [academicYearJoined, setAcademicYearJoined] = useState("");

  // Data
  const [specializations, setSpecializations] = useState<Specialization[]>([]);

  const isTutor = roleName === "tutor";

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/auth/login";
        return;
      }
      setUserId(user.id);

      // Get profile with role
      const { data: profile } = await supabase
        .from("profiles")
        .select("*, roles(name)")
        .eq("id", user.id)
        .single();

      if (profile) {
        setFirstName(profile.first_name || "");
        setLastName(profile.last_name || "");
        setMembershipNumber(profile.membership_number || "");
        setAvatarUrl(profile.avatar_url || null);
        setRoleName(getRoleName(profile));
        setDegreeProgram(profile.degree_program || "");
        if (profile.year_level) setYearLevel(profile.year_level);
        setAcademicYearJoined(profile.academic_year_joined || "");

        // If profile already completed, go to dashboard
        if (profile.profile_completed) {
          window.location.href = "/dashboard";
          return;
        }
      }

      // Load specializations for tutors
      const { data: specs } = await supabase
        .from("specializations")
        .select("id, name")
        .order("name");
      if (specs) setSpecializations(specs);

      // Load existing tutor specializations
      if (profile && profile.roles && Array.isArray(profile.roles)) {
        const roles = profile.roles as Array<{ name: string }>;
        if (roles[0]?.name === "tutor") {
          const { data: tutorRow } = await supabase
            .from("tutors")
            .select("id")
            .eq("user_id", user.id)
            .single();

          if (tutorRow) {
            const { data: tutorSpecs } = await supabase
              .from("tutor_specializations")
              .select("specialization_id")
              .eq("tutor_id", tutorRow.id);
            if (tutorSpecs) {
              setSelectedSpecs(
                tutorSpecs.map(
                  (s: { specialization_id: string }) => s.specialization_id,
                ),
              );
            }
          }
        }
      }

      setLoading(false);
    }
    load();
  }, []);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    // Client-side validation
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a JPEG, PNG, GIF, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      // Store the actual pathname in state
      setAvatarPathname(data.pathname);
      // Convert pathname to displayable URL for private Blob
      const displayUrl = `/api/avatar?pathname=${encodeURIComponent(data.pathname)}`;
      setAvatarUrl(displayUrl);
      toast.success("Photo uploaded!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function toggleSpec(specId: string) {
    setSelectedSpecs((prev: string[]) =>
      prev.includes(specId)
        ? prev.filter((id: string) => id !== specId)
        : [...prev, specId],
    );
  }

  async function handleSave() {
    if (!userId) return;
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("First name and last name are required");
      return;
    }

    if (isTutor && !membershipNumber.trim()) {
      toast.error("Membership number is required for tutors");
      return;
    }

    setSaving(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          full_name: `${firstName.trim()} ${lastName.trim()}`,
          avatar_url: avatarPathname || null, // Store the actual Blob pathname
          membership_number: isTutor ? membershipNumber.trim() || null : null,
          degree_program: !isTutor ? degreeProgram.trim() || null : null,
          year_level: !isTutor && yearLevel !== "" ? Number(yearLevel) : null,
          academic_year_joined: academicYearJoined || null,
          profile_completed: true,
        })
        .eq("id", userId);

      if (profileError) throw profileError;

      // If tutor, update specializations
      if (isTutor) {
        // Get or create tutor row
        let { data: tutorRow } = await supabase
          .from("tutors")
          .select("id")
          .eq("user_id", userId)
          .single();

        if (!tutorRow) {
          const { data: newTutor } = await supabase
            .from("tutors")
            .insert({
              user_id: userId,
              bio: bio.trim() || null,
              hourly_rate: hourlyRate !== "" ? Number(hourlyRate) : null,
              years_experience:
                yearsExperience !== "" ? Number(yearsExperience) : null,
            })
            .select("id")
            .single();
          tutorRow = newTutor;
        } else {
          await supabase
            .from("tutors")
            .update({
              bio: bio.trim() || null,
              hourly_rate: hourlyRate !== "" ? Number(hourlyRate) : null,
              years_experience:
                yearsExperience !== "" ? Number(yearsExperience) : null,
            })
            .eq("id", tutorRow.id);
        }

        if (tutorRow) {
          // Clear old and insert new
          await supabase
            .from("tutor_specializations")
            .delete()
            .eq("tutor_id", tutorRow.id);

          if (selectedSpecs.length > 0) {
            await supabase.from("tutor_specializations").insert(
              selectedSpecs.map((specId: string) => ({
                tutor_id: tutorRow!.id,
                specialization_id: specId,
              })),
            );
          }
        }
      }

      await ensureTutor();

      toast.success("Profile setup complete!");
      window.location.href = "/dashboard";
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save profile",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const initials =
    `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "?";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="mb-8 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <GraduationCap className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold tracking-tight text-foreground">
          ScholarMe
        </span>
      </div>

      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>
            {isTutor
              ? "Set up your tutor profile to start accepting sessions"
              : "Tell us a bit about yourself to get started"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage
                  src={getAvatarUrl(avatarUrl) || undefined}
                  alt="Profile photo"
                />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Click the camera icon to upload a photo
            </p>
          </div>

          {/* Name fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Juan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Dela Cruz"
              />
            </div>
          </div>

          {/* Academic Year Joined (Required for all) */}
          <div className="space-y-2">
            <Label htmlFor="academicYearJoined">Academic Year Joined *</Label>
            <select
              id="academicYearJoined"
              value={academicYearJoined}
              onChange={(e) => setAcademicYearJoined(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Select academic year</option>
              <option value="2022-2023">2022-2023</option>
              <option value="2023-2024">2023-2024</option>
              <option value="2024-2025">2024-2025</option>
              <option value="2025-2026">2025-2026</option>
              <option value="2026-2027">2026-2027</option>
            </select>
          </div>

          {/* Learner-specific fields have been moved to sign-up */}
          {/* Tutor-specific fields */}
          {isTutor && (
            <>
              <div className="space-y-2">
                <Label htmlFor="membershipNumber">Membership Number</Label>
                <Input
                  id="membershipNumber"
                  value={membershipNumber}
                  onChange={(e) => setMembershipNumber(e.target.value)}
                  placeholder="e.g. TM-2025-001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Tutor Bio *</Label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell students about your teaching experience and style..."
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Hourly Rate (₱)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    min="0"
                    value={hourlyRate}
                    onChange={(e) =>
                      setHourlyRate(
                        e.target.value ? Number(e.target.value) : "",
                      )
                    }
                    placeholder="e.g. 250"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearsExperience">Years Experience</Label>
                  <Input
                    id="yearsExperience"
                    type="number"
                    min="0"
                    value={yearsExperience}
                    onChange={(e) =>
                      setYearsExperience(
                        e.target.value ? Number(e.target.value) : "",
                      )
                    }
                    placeholder="e.g. 2"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Specializations *</Label>
                <p className="text-xs text-muted-foreground">
                  Select at least one subject you can tutor
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {specializations.map((spec: { id: string; name: string }) => {
                    const isSelected = selectedSpecs.includes(spec.id);
                    return (
                      <button
                        key={spec.id}
                        type="button"
                        onClick={() => toggleSpec(spec.id)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="h-3.5 w-3.5" />}
                        {spec.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <Button
            onClick={handleSave}
            disabled={
              saving ||
              !firstName.trim() ||
              !lastName.trim() ||
              !academicYearJoined ||
              (isTutor && (!bio.trim() || selectedSpecs.length === 0)) ||
              (!isTutor && (!degreeProgram.trim() || yearLevel === ""))
            }
            className="w-full"
            size="lg"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Complete Setup"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
