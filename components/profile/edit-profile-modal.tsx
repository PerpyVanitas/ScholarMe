"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Camera, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import type { Profile } from "@/lib/types";

interface Specialization {
  id: string;
  name: string;
}

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile;
  roleName: string;
  avatarUrl: string | null;
  onProfileUpdated: (updatedProfile: Partial<Profile>, newAvatarUrl?: string) => void;
}

export function EditProfileModal({
  open,
  onOpenChange,
  profile,
  roleName,
  avatarUrl: initialAvatarUrl,
  onProfileUpdated,
}: EditProfileModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state - initialize from profile
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [membershipNumber, setMembershipNumber] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const isTutor = roleName === "tutor";

  // Reset form when modal opens
  useEffect(() => {
    if (open && profile) {
      // Parse first/last name from full_name if separate fields are empty
      let fn = profile.first_name || "";
      let ln = profile.last_name || "";
      if ((!fn || !ln) && profile.full_name) {
        const parts = profile.full_name.trim().split(/\s+/);
        if (parts.length >= 2) {
          fn = fn || parts[0];
          ln = ln || parts.slice(1).join(" ");
        } else if (parts.length === 1) {
          fn = fn || parts[0];
        }
      }
      setFirstName(fn);
      setLastName(ln);
      setPhoneNumber(profile.phone_number || "");
      setBirthdate(profile.birthdate || profile.date_of_birth || "");
      setMembershipNumber(profile.membership_number || "");
      setAvatarUrl(initialAvatarUrl);

      // Load specializations for tutors
      if (isTutor) {
        loadSpecializations();
      }
    }
  }, [open, profile, initialAvatarUrl, isTutor]);

  async function loadSpecializations() {
    const supabase = createClient();
    const { data: specs } = await supabase
      .from("specializations")
      .select("id, name")
      .order("name");
    if (specs) setSpecializations(specs);

    const { data: tutorRow } = await supabase
      .from("tutors")
      .select("id")
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (tutorRow) {
      const { data: tutorSpecs } = await supabase
        .from("tutor_specializations")
        .select("specialization_id")
        .eq("tutor_id", tutorRow.id);
      if (tutorSpecs) {
        setSelectedSpecs(tutorSpecs.map(s => s.specialization_id));
      }
    }
  }

  function toggleSpec(specId: string) {
    setSelectedSpecs(prev =>
      prev.includes(specId) ? prev.filter(id => id !== specId) : [...prev, specId]
    );
  }

  const handleAvatarUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

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

      const res = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setAvatarUrl(data.url);
      toast.success("Photo updated!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [profile]);

  const handleSave = useCallback(async () => {
    if (!profile) return;
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("First name and last name are required");
      return;
    }
    setSaving(true);

    try {
      const supabase = createClient();

      // Debug: Check auth status
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log("[v0] Auth check - user:", user?.id, "error:", authError);
      console.log("[v0] Profile ID to update:", profile.id);
      console.log("[v0] IDs match:", user?.id === profile.id);

      if (!user) {
        toast.error("You must be logged in to update your profile");
        return;
      }

      if (user.id !== profile.id) {
        console.log("[v0] ERROR: Auth user ID does not match profile ID!");
        toast.error("Permission denied: Cannot update another user's profile");
        return;
      }

      const updatePayload = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: `${firstName.trim()} ${lastName.trim()}`,
        phone_number: phoneNumber.trim() || null,
        birthdate: birthdate || null,
        date_of_birth: birthdate || null,
        membership_number: isTutor ? membershipNumber.trim() || null : null,
      };
      console.log("[v0] Update payload:", updatePayload);

      const { data, error } = await supabase
        .from("profiles")
        .update(updatePayload)
        .eq("id", profile.id)
        .select();

      console.log("[v0] Update result - data:", data, "error:", error);

      if (error) throw error;

      if (isTutor) {
        let { data: tutorRow } = await supabase
          .from("tutors")
          .select("id")
          .eq("profile_id", profile.id)
          .maybeSingle();

        if (!tutorRow) {
          const { data: newTutor } = await supabase
            .from("tutors")
            .insert({ profile_id: profile.id })
            .select("id")
            .single();
          tutorRow = newTutor;
        }

        if (tutorRow) {
          await supabase.from("tutor_specializations").delete().eq("tutor_id", tutorRow.id);
          if (selectedSpecs.length > 0) {
            await supabase
              .from("tutor_specializations")
              .insert(selectedSpecs.map(specId => ({
                tutor_id: tutorRow!.id,
                specialization_id: specId,
              })));
          }
        }
      }

      // Notify parent of updates
      onProfileUpdated({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: `${firstName.trim()} ${lastName.trim()}`,
        phone_number: phoneNumber.trim() || null,
        birthdate: birthdate || null,
        date_of_birth: birthdate || null,
        membership_number: isTutor ? membershipNumber.trim() || null : null,
      }, avatarUrl || undefined);

      toast.success("Profile updated successfully");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }, [profile, firstName, lastName, phoneNumber, birthdate, membershipNumber, isTutor, selectedSpecs, avatarUrl, onProfileUpdated, onOpenChange]);

  function handleCancel() {
    onOpenChange(false);
  }

  function getInitials(): string {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (profile?.full_name) {
      const parts = profile.full_name.trim().split(/\s+/);
      if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      if (parts.length === 1 && parts[0]) return parts[0][0].toUpperCase();
    }
    return "?";
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile information. Click save when you're done.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-4">
          {/* Avatar */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="relative h-24 w-24 rounded-full overflow-hidden bg-muted">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile photo"
                    className="h-full w-full object-cover"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary text-2xl font-semibold">
                    {getInitials()}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-colors hover:bg-primary/90 disabled:opacity-50"
                aria-label="Upload photo"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                aria-label="Choose profile photo"
              />
            </div>
          </div>

          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-firstName">First Name *</Label>
              <Input
                id="edit-firstName"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="Enter your first name"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-lastName">Last Name *</Label>
              <Input
                id="edit-lastName"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Enter your last name"
              />
            </div>
          </div>

          {/* Email (read-only) */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input id="edit-email" value={profile?.email || ""} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">Contact your administrator to change your email.</p>
          </div>

          {/* Phone Number */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-phone">Phone Number</Label>
            <Input
              id="edit-phone"
              type="tel"
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
              placeholder="Enter your phone number"
            />
          </div>

          {/* Birthdate */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-birthdate">Birthdate</Label>
            <Input
              id="edit-birthdate"
              type="date"
              value={birthdate}
              onChange={e => setBirthdate(e.target.value)}
            />
          </div>

          {/* Tutor-specific fields */}
          {isTutor && (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-membershipNumber">Membership Number</Label>
                <Input
                  id="edit-membershipNumber"
                  value={membershipNumber}
                  onChange={e => setMembershipNumber(e.target.value)}
                  placeholder="Enter your membership number"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label>Specializations</Label>
                <p className="text-xs text-muted-foreground">Select the subjects you can tutor</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {specializations.map(spec => {
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
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCancel} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !firstName.trim() || !lastName.trim()}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
