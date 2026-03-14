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
import { Loader2, Save, Trash2, Camera, CheckCircle2, User, Key, Eye, EyeOff } from "lucide-react";
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

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

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
          
          // Parse first/last name from full_name if separate fields are empty
          let fn = data.first_name || "";
          let ln = data.last_name || "";
          if ((!fn || !ln) && data.full_name) {
            const parts = data.full_name.trim().split(/\s+/);
            if (parts.length >= 2) {
              fn = fn || parts[0];
              ln = ln || parts.slice(1).join(" ");
            } else if (parts.length === 1) {
              fn = fn || parts[0];
            }
          }
          setFirstName(fn);
          setLastName(ln);
          
          // Use date_of_birth as fallback for birthdate
          const bd = data.birthdate || data.date_of_birth || "";
          setBirthdate(bd);
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
      // Use Vercel Blob API for upload
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/account/avatar", {
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
          date_of_birth: birthdate || null,
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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }, [profile, firstName, lastName, birthdate, membershipNumber, isTutor, selectedSpecs]);

  async function handleChangePassword() {
    if (!newPassword || !currentPassword) {
      toast.error("Please fill in all password fields");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to change password");
      } else {
        toast.success("Password changed successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setChangingPassword(false);
    }
  }

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
                placeholder="Enter your first name"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Enter your last name"
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

      {/* Password Change */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>Update your account password. You will need to enter your current password to confirm.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showPasswords ? "text" : "password"}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type={showPasswords ? "text" : "password"}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
              <Input
                id="confirmNewPassword"
                type={showPasswords ? "text" : "password"}
                value={confirmNewPassword}
                onChange={e => setConfirmNewPassword(e.target.value)}
                placeholder="Repeat new password"
              />
            </div>
          </div>
          {newPassword && confirmNewPassword && newPassword !== confirmNewPassword && (
            <p className="text-xs text-destructive">Passwords do not match</p>
          )}
          <Button
            onClick={handleChangePassword}
            disabled={changingPassword || !currentPassword || !newPassword || newPassword !== confirmNewPassword}
            className="w-fit"
          >
            {changingPassword ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Key className="mr-2 h-4 w-4" />
                Update Password
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
