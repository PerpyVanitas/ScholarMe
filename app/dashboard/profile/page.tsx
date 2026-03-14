"use client";

import { useState, useEffect, useRef } from "react";
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
import { Loader2, Trash2, Key, Eye, EyeOff, Pencil, Calendar, Mail, Phone, Award, Clock } from "lucide-react";
import { toast } from "sonner";
import { DEMO_USERS, getDemoUserFromCookie } from "@/lib/demo";
import { EditProfileModal } from "@/components/profile/edit-profile-modal";
import type { Profile } from "@/lib/types";

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

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "Not set";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "Not set";
  }
}

export default function ProfilePage() {
  const router = useRouter();
  const loadedRef = useRef(false);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [roleName, setRoleName] = useState("learner");

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

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
          if (data.roles?.name) setRoleName(data.roles.name);
          
          // Handle private blob pathnames vs full URLs
          if (data.avatar_url) {
            if (data.avatar_url.startsWith("avatars/")) {
              setAvatarUrl(`/api/upload/avatar?pathname=${encodeURIComponent(data.avatar_url)}`);
            } else {
              setAvatarUrl(data.avatar_url);
            }
          } else {
            setAvatarUrl(null);
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

  function handleProfileUpdated(updatedProfile: Partial<Profile>, newAvatarUrl?: string) {
    setProfile(prev => prev ? { ...prev, ...updatedProfile } : null);
    if (newAvatarUrl !== undefined) {
      setAvatarUrl(newAvatarUrl);
    }
  }

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

  // Get display values
  const firstName = profile.first_name || "";
  const lastName = profile.last_name || "";
  const fullName = profile.full_name || `${firstName} ${lastName}`.trim() || "User";
  const birthdate = profile.birthdate || profile.date_of_birth || null;
  const membershipNumber = profile.membership_number || null;

  const initials = getInitials(firstName, lastName, fullName);
  const roleLabel =
    roleName === "administrator" ? "Administrator"
      : roleName === "tutor" ? "Tutor"
        : "Learner";
  const isTutor = roleName === "tutor";

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground text-balance">Profile</h1>
        <p className="text-muted-foreground">View and manage your account settings.</p>
      </div>

      {/* Profile Card - View Only */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
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
              <div className="flex flex-col gap-1">
                <CardTitle className="text-xl">{fullName}</CardTitle>
                <CardDescription className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {profile.email}
                </CardDescription>
                <Badge variant="secondary" className="w-fit mt-1">{roleLabel}</Badge>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setEditModalOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Birthday</p>
                <p className="text-sm text-muted-foreground">{formatDate(birthdate)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Member Since</p>
                <p className="text-sm text-muted-foreground">{formatDate(profile.created_at)}</p>
              </div>
            </div>

            {profile.phone_number && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">{profile.phone_number}</p>
                </div>
              </div>
            )}

            {isTutor && membershipNumber && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Award className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Membership Number</p>
                  <p className="text-sm text-muted-foreground">{membershipNumber}</p>
                </div>
              </div>
            )}
          </div>
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

      {/* Edit Profile Modal */}
      <EditProfileModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        profile={profile}
        roleName={roleName}
        avatarUrl={avatarUrl}
        onProfileUpdated={handleProfileUpdated}
      />
    </div>
  );
}
