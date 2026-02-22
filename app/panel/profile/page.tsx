"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Save, Trash2, Camera, CheckCircle2, User } from "lucide-react";
import { toast } from "sonner";
import { DEMO_USERS, getDemoUserFromCookie } from "@/lib/demo";
import type { Profile } from "@/lib/types";

interface Specialization {
  id: string;
  name: string;
}

function getInitials(firstName: string, lastName: string, fullName?: string | null): string {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  if (fullName) {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    if (parts.length === 1 && parts[0]) return parts[0][0].toUpperCase();
  }
  return "?";
}

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadedRef = useRef(false);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [membershipNumber, setMembershipNumber] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [roleName, setRoleName] = useState("learner");

  const isTutor = roleName === "tutor";

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    async function loadProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*, roles(*)")
          .eq("id", user.id)
          .maybeSingle();

        if (data) {
          setProfile(data);
          setFirstName(data.first_name || "");
          setLastName(data.last_name || "");
          setBirthdate(data.birthdate || "");
          setMembershipNumber(data.membership_number || "");
          setAvatarUrl(data.avatar_url || null);
          if (data.roles?.name) setRoleName(data.roles.name);

          // Load specializations for tutors
          if (data.roles?.name === "tutor") {
            const { data: specs } = await supabase
              .from("specializations")
              .select("id, name")
              .order("name");
            if (specs) setSpecializations(specs);

            const { data: tutorRow } = await supabase
              .from("tutors")
              .select("id")
              .eq("profile_id", user.id)
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
        } else {
          // User exists but no profile row
          setProfile({
            id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
            email: user.email || "",
            avatar_url: null,
            created_at: user.created_at || new Date().toISOString(),
            role_id: null,
            roles: { id: "fallback", name: "learner" },
          } as Profile);
        }

        setLoading(false);
        return;
      }

      // Demo mode fallback
      const { role: devRole } = getDemoUserFromCookie("learner");
      const demoInfo = DEMO_USERS[devRole as keyof typeof DEMO_USERS] || DEMO_USERS.learner;
      setProfile({
        id: demoInfo.profileId,
        full_name: demoInfo.fullName,
        email: demoInfo.email,
        avatar_url: null,
        created_at: new Date().toISOString(),
        role_id: "demo-role",
        roles: { id: "demo-role", name: devRole },
      } as Profile);
      setRoleName(devRole);
      setLoading(false);
    }

    loadProfile();
  }, []);

  const handleAvatarUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const filePath = `${profile.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Append cache-busting param so browser reloads image
      const freshUrl = `${publicUrl}?t=${Date.now()}`;
      setAvatarUrl(freshUrl);
      await supabase.from("profiles").update({ avatar_url: freshUrl }).eq("id", profile.id);
      toast.success("Photo updated!");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [profile]);

  function toggleSpec(specId: string) {
    setSelectedSpecs(prev =>
      prev.includes(specId) ? prev.filter(id => id !== specId) : [...prev, specId]
    );
  }

  const handleSave = useCallback(async () => {
    if (!profile) return;
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("First name and last name are required");
      return;
    }
    setSaving(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          full_name: `${firstName.trim()} ${lastName.trim()}`,
          birthdate: birthdate || null,
          membership_number: isTutor ? membershipNumber.trim() || null : null,
        })
        .eq("id", profile.id);

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

      setProfile(prev => prev ? {
        ...prev,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: `${firstName.trim()} ${lastName.trim()}`,
      } : null);
      toast.success("Profile updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }, [profile, firstName, lastName, birthdate, membershipNumber, isTutor, selectedSpecs]);

  async function handleDeleteAccount() {
    setDeleting(true);
    const res = await fetch("/api/account", { method: "DELETE" });
    if (res.ok) {
      toast.success("Account deleted successfully");
      router.push("/");
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to delete account");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) return null;

  const initials = getInitials(firstName, lastName, profile.full_name);
  const roleLabel =
    roleName === "administrator" ? "Administrator"
      : roleName === "tutor" ? "Tutor"
        : "Learner";

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground text-balance">Profile</h1>
        <p className="text-muted-foreground">Manage your account settings and profile details.</p>
      </div>

      {/* Profile Card */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="relative h-20 w-20 rounded-full overflow-hidden bg-muted">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile photo"
                    className="h-full w-full object-cover"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary text-xl font-semibold">
                    {initials}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-colors hover:bg-primary/90 disabled:opacity-50"
                aria-label="Upload photo"
              >
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
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
            <div className="flex flex-col gap-1">
              <CardTitle>{profile.full_name || "User"}</CardTitle>
              <CardDescription>{profile.email}</CardDescription>
              <Badge variant="secondary" className="w-fit">{roleLabel}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="Juan"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Dela Cruz"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={profile.email} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">Contact your administrator to change your email.</p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="birthdate">Birthdate</Label>
            <Input
              id="birthdate"
              type="date"
              value={birthdate}
              onChange={e => setBirthdate(e.target.value)}
            />
          </div>

          {isTutor && (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="membershipNumber">Membership Number</Label>
                <Input
                  id="membershipNumber"
                  value={membershipNumber}
                  onChange={e => setMembershipNumber(e.target.value)}
                  placeholder="e.g. TM-2025-001"
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

          <div className="flex flex-col gap-2">
            <Label>Member Since</Label>
            <p className="text-sm text-muted-foreground">
              {new Date(profile.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <Button onClick={handleSave} disabled={saving || !firstName.trim() || !lastName.trim()} className="w-fit">
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
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Permanently delete your account and all associated data. This action cannot be undone.</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your account, profile, and all associated data including sessions and resources. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex flex-col gap-2 py-2">
                <Label htmlFor="confirm-delete" className="text-sm text-muted-foreground">
                  {"Type \"DELETE\" to confirm"}
                </Label>
                <Input
                  id="confirm-delete"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="font-mono"
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setConfirmText("")}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={confirmText !== "DELETE" || deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Account Permanently"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
