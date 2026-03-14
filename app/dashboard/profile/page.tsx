"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Profile, Specialization } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  User, Mail, Phone, Calendar, Clock, Award, Edit2, Loader2, 
  Key, Eye, EyeOff, Trash2, AlertTriangle, Camera, X
} from "lucide-react";
import { useRouter } from "next/navigation";
import { updateProfile, UpdateProfileData } from "./actions";

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  // Profile state
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roleName, setRoleName] = useState("learner");
  const [loading, setLoading] = useState(true);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editBirthdate, setEditBirthdate] = useState("");
  const [editMembershipNumber, setEditMembershipNumber] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  // Delete account state
  const [deleting, setDeleting] = useState(false);

  const isTutor = roleName === "tutor";

  // Load profile data
  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*, roles(name)")
        .eq("id", user.id)
        .single();

      if (error) {
        toast.error("Failed to load profile");
        setLoading(false);
        return;
      }

      if (data) {
        setProfile(data);
        if (data.roles?.name) setRoleName(data.roles.name);

        // Load tutor specializations if tutor
        if (data.roles?.name === "tutor") {
          const { data: tutorData } = await supabase
            .from("tutors")
            .select("tutor_specializations(specializations(id, name))")
            .eq("user_id", user.id)
            .single();

          if (tutorData?.tutor_specializations) {
            const specs = tutorData.tutor_specializations
              .map((ts: { specializations: Specialization }) => ts.specializations)
              .filter(Boolean);
            setSpecializations(specs);
          }
        }
      }
      setLoading(false);
    }

    loadProfile();
  }, [supabase, router]);

  // Open edit modal with current values
  const openEditModal = useCallback(() => {
    if (!profile) return;
    
    // Parse name from full_name if first/last not set
    let fn = profile.first_name || "";
    let ln = profile.last_name || "";
    if ((!fn || !ln) && profile.full_name) {
      const parts = profile.full_name.trim().split(/\s+/);
      fn = fn || parts[0] || "";
      ln = ln || parts.slice(1).join(" ") || "";
    }

    setEditFirstName(fn);
    setEditLastName(ln);
    setEditPhone(profile.phone_number || "");
    setEditBirthdate(profile.birthdate || profile.date_of_birth || "");
    setEditMembershipNumber(profile.membership_number || "");
    // Set avatar URL - convert pathname to API route if needed
    if (profile.avatar_url?.startsWith("avatars/")) {
      setEditAvatarUrl(`/api/avatar?pathname=${encodeURIComponent(profile.avatar_url)}`);
    } else {
      setEditAvatarUrl(profile.avatar_url || null);
    }
    setEditOpen(true);
  }, [profile]);

  // Handle avatar upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a JPEG, PNG, GIF, or WebP image");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploadingAvatar(true);

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

      // Update the avatar URL in the edit modal
      const newAvatarUrl = `/api/avatar?pathname=${encodeURIComponent(data.pathname)}`;
      setEditAvatarUrl(newAvatarUrl);
      
      // Update the profile state immediately
      setProfile(prev => prev ? { ...prev, avatar_url: data.pathname } : null);
      
      toast.success("Photo uploaded successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload photo");
    } finally {
      setUploadingAvatar(false);
      // Reset the input
      e.target.value = "";
    }
  };

  // Handle avatar removal
  const handleRemoveAvatar = async () => {
    setUploadingAvatar(true);

    try {
      const res = await fetch("/api/avatar", { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove photo");
      }

      setEditAvatarUrl(null);
      setProfile(prev => prev ? { ...prev, avatar_url: null } : null);
      toast.success("Photo removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove photo");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Save profile changes using server action
  const handleSaveProfile = async () => {
    if (!editFirstName.trim() || !editLastName.trim()) {
      toast.error("First name and last name are required");
      return;
    }

    setSaving(true);
    
    const updateData: UpdateProfileData = {
      first_name: editFirstName.trim(),
      last_name: editLastName.trim(),
      phone_number: editPhone.trim() || null,
      birthdate: editBirthdate || null,
      membership_number: isTutor ? editMembershipNumber.trim() || null : null,
    };

    const result = await updateProfile(updateData);

    if (result.success) {
      // Update local state
      setProfile(prev => prev ? {
        ...prev,
        first_name: updateData.first_name,
        last_name: updateData.last_name,
        full_name: `${updateData.first_name} ${updateData.last_name}`,
        phone_number: updateData.phone_number,
        birthdate: updateData.birthdate,
        date_of_birth: updateData.birthdate,
        membership_number: updateData.membership_number,
      } : null);
      
      toast.success("Profile updated successfully");
      setEditOpen(false);
    } else {
      toast.error(result.error || "Failed to update profile");
    }

    setSaving(false);
  };

  // Change password
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.error("Please fill in all password fields");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setChangingPassword(true);
    
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    
    if (error) {
      toast.error(error.message || "Failed to change password");
    } else {
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    
    setChangingPassword(false);
  };

  // Delete account
  const handleDeleteAccount = async () => {
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
  };

  // Format date for display
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "Not set";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  // Get display URL for avatar (handles private blob pathnames)
  const getAvatarDisplayUrl = (avatarUrl: string | null | undefined) => {
    if (!avatarUrl) return undefined;
    if (avatarUrl.startsWith("avatars/")) {
      return `/api/avatar?pathname=${encodeURIComponent(avatarUrl)}`;
    }
    return avatarUrl;
  };

  if (loading) {
    return (
      <div className="container max-w-4xl py-8 space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Profile not found. Please try logging in again.
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayName = profile.full_name || `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "User";

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
              <AvatarImage src={getAvatarDisplayUrl(profile.avatar_url)} alt={displayName} />
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h1 className="text-2xl font-bold">{displayName}</h1>
                <Badge variant="secondary" className="w-fit mx-auto sm:mx-0 capitalize">
                  {roleName}
                </Badge>
              </div>
              <p className="text-muted-foreground">{profile.email}</p>
              
              {specializations.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-2">
                  {specializations.map(spec => (
                    <Badge key={spec.id} variant="outline">{spec.name}</Badge>
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

      {/* Profile Details */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Your personal details and account information</CardDescription>
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
                <p className="text-sm text-muted-foreground">{profile.phone_number || "Not set"}</p>
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
                <p className="text-sm text-muted-foreground">{formatDate(profile.created_at)}</p>
              </div>
            </div>

            {isTutor && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Award className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Membership Number</p>
                  <p className="text-sm text-muted-foreground">{profile.membership_number || "Not set"}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showPasswords ? "text" : "password"}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
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

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type={showPasswords ? "text" : "password"}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type={showPasswords ? "text" : "password"}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
              />
            </div>
          </div>

          {newPassword && confirmPassword && newPassword !== confirmPassword && (
            <p className="text-sm text-destructive">Passwords do not match</p>
          )}

          <Button
            onClick={handleChangePassword}
            disabled={changingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}
          >
            {changingPassword ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Password"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible actions for your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Edit Profile Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your personal information</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <Avatar className="h-20 w-20 border-2 border-muted">
                  <AvatarImage src={editAvatarUrl || undefined} alt="Profile" />
                  <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
                {uploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  disabled={uploadingAvatar}
                  onClick={() => document.getElementById("avatar-upload")?.click()}
                >
                  <Camera className="h-4 w-4" />
                  {editAvatarUrl ? "Change" : "Upload"}
                </Button>
                {editAvatarUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    disabled={uploadingAvatar}
                    onClick={handleRemoveAvatar}
                  >
                    <X className="h-4 w-4" />
                    Remove
                  </Button>
                )}
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
              <p className="text-xs text-muted-foreground">JPEG, PNG, GIF or WebP. Max 5MB.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editFirstName">First Name *</Label>
                <Input
                  id="editFirstName"
                  value={editFirstName}
                  onChange={e => setEditFirstName(e.target.value)}
                  placeholder="First name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLastName">Last Name *</Label>
                <Input
                  id="editLastName"
                  value={editLastName}
                  onChange={e => setEditLastName(e.target.value)}
                  placeholder="Last name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editPhone">Phone Number</Label>
              <Input
                id="editPhone"
                type="tel"
                value={editPhone}
                onChange={e => setEditPhone(e.target.value)}
                placeholder="Enter phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editBirthdate">Birthday</Label>
              <Input
                id="editBirthdate"
                type="date"
                value={editBirthdate}
                onChange={e => setEditBirthdate(e.target.value)}
              />
            </div>

            {isTutor && (
              <div className="space-y-2">
                <Label htmlFor="editMembershipNumber">Membership Number</Label>
                <Input
                  id="editMembershipNumber"
                  value={editMembershipNumber}
                  onChange={e => setEditMembershipNumber(e.target.value)}
                  placeholder="Enter membership number"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
