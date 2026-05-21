"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Profile, Specialization, HsDesignation, DesignationType } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  User, Mail, Phone, Calendar, Clock, Award, Edit2, Loader2, 
  Key, Eye, EyeOff, Trash2, AlertTriangle, Camera, X, BookOpen, Star,
  Crown, Shield, GraduationCap, Plus
} from "lucide-react";
import { ImageCropper } from "@/components/image-cropper";
import { useRouter } from "next/navigation";
import { updateProfile, UpdateProfileData, updateTutorInfo, ensureProfile } from "./actions";
import { useUser } from "@/lib/user-context";
import { QrIdCard } from "@/features/auth/components/qr-id-card";
import { getRoleName } from "@/lib/utils/roles";

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const { refreshProfile } = useUser();

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
  const [editDegreeProgram, setEditDegreeProgram] = useState("");
  const [editYearLevel, setEditYearLevel] = useState("");
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

  // Tutor settings state
  const [tutorSettingsOpen, setTutorSettingsOpen] = useState(false);
  const [tutorBio, setTutorBio] = useState("");
  const [hourlyRate, setHourlyRate] = useState<number | null>(null);
  const [yearsExperience, setYearsExperience] = useState<number | null>(null);
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([]);
  const [allSpecializations, setAllSpecializations] = useState<Specialization[]>([]);
  const [tutorData, setTutorData] = useState<any>(null);
  const [savingTutor, setSavingTutor] = useState(false);

  const isTutor = roleName === "tutor";

  // Designation state
  const [designations, setDesignations] = useState<HsDesignation[]>([]);
  const [designationDialogOpen, setDesignationDialogOpen] = useState(false);
  const [editingDesignation, setEditingDesignation] = useState<HsDesignation | null>(null);
  const [desigType, setDesigType] = useState<DesignationType>("member");
  const [desigPosition, setDesigPosition] = useState("");
  const [desigAcademicYear, setDesigAcademicYear] = useState("2024-2025");
  const [desigIsCurrent, setDesigIsCurrent] = useState(false);
  const [savingDesignation, setSavingDesignation] = useState(false);

  // Image cropper state
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperImageSrc, setCropperImageSrc] = useState<string | null>(null);

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
        .maybeSingle();

      if (error || !data) {
        console.warn("Profile fetch returned error or no data, healing:", error);
        const heal = await ensureProfile();
        if (heal.success) {
          const { data: healed } = await supabase
            .from("profiles")
            .select("*, roles(name)")
            .eq("id", user.id)
            .maybeSingle();
          if (healed) {
            setProfile(healed);
            setRoleName(getRoleName(healed));
            setLoading(false);
            return;
          }
        }

        let fallbackRole = "learner";
        if (user.email === "admin@scholarme.org" || user.user_metadata?.role_name === "administrator" || user.user_metadata?.role === "administrator") {
          fallbackRole = "administrator";
        } else if (user.user_metadata?.role_name === "tutor" || user.user_metadata?.role === "tutor") {
          fallbackRole = "tutor";
        }

        const fullNameStr = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
        let derivedFirstName = user.user_metadata?.first_name || "";
        let derivedLastName = user.user_metadata?.last_name || "";
        if (!derivedFirstName && !derivedLastName) {
          const parts = fullNameStr.trim().split(/\s+/);
          derivedFirstName = parts[0] || "";
          derivedLastName = parts.slice(1).join(" ") || "";
        }

        const fallbackProfile: any = {
          id: user.id,
          role_id: null,
          full_name: fullNameStr,
          first_name: derivedFirstName || null,
          last_name: derivedLastName || null,
          email: user.email || "",
          avatar_url: null,
          phone_number: null,
          birthdate: null,
          date_of_birth: null,
          membership_number: null,
          degree_program: null,
          year_level: null,
          total_xp: 0,
          current_level: 1,
          profile_completed: false,
          created_at: user.created_at || new Date().toISOString(),
          roles: { name: fallbackRole }
        };

        setProfile(fallbackProfile);
        setRoleName(fallbackRole);
      } else {
        setProfile(data);
        const loadedRole = getRoleName(data);
        setRoleName(loadedRole);

        // Load tutor data and specializations if tutor
        if (loadedRole === "tutor") {
          // Load all available specializations
          const { data: allSpecs } = await supabase
            .from("specializations")
            .select("id, name");
          
          if (allSpecs) {
            setAllSpecializations(allSpecs);
          }

          // Load tutor-specific data
          const { data: tutorInfo } = await supabase
            .from("tutors")
            .select("id, bio, hourly_rate, years_experience, tutor_specializations(specializations(id, name))")
            .eq("user_id", user.id)
            .single();

          if (tutorInfo) {
            setTutorData(tutorInfo);
            setTutorBio(tutorInfo.bio || "");
            setHourlyRate(tutorInfo.hourly_rate);
            setYearsExperience(tutorInfo.years_experience);
            
            if (tutorInfo.tutor_specializations) {
              const specs = tutorInfo.tutor_specializations
                .map((ts: any) => {
                  const specs = Array.isArray(ts.specializations) ? ts.specializations : [];
                  return specs.length > 0 ? specs[0] : null;
                })
                .filter(Boolean);
              setSpecializations(specs);
              setSelectedSpecializations(specs.map((s: any) => s.id));
            }
          }
        }

        // Load Honor Society designation history
        const { data: desigData } = await supabase
          .from("hs_designations")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (desigData) setDesignations(desigData);
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
    setEditDegreeProgram(profile.degree_program || "");
    setEditYearLevel(profile.year_level?.toString() || "");
    // Set avatar URL - convert pathname to API route if needed
    if (profile.avatar_url?.startsWith("avatars/")) {
      setEditAvatarUrl(`/api/avatar?pathname=${encodeURIComponent(profile.avatar_url)}`);
    } else {
      setEditAvatarUrl(profile.avatar_url || null);
    }
    setEditOpen(true);
  }, [profile]);

  // Handle avatar file selection — open cropper first
  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a JPEG, PNG, GIF, or WebP image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCropperImageSrc(reader.result as string);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
    // Reset input so the same file can be selected again
    e.target.value = "";
  };

  // Upload the cropped blob to the server
  const handleCroppedUpload = async (blob: Blob) => {
    setCropperOpen(false);
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", blob, "avatar.jpg");
      const res = await fetch("/api/avatar", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      const apiUrl = data.pathname
        ? `/api/avatar?pathname=${encodeURIComponent(data.pathname)}`
        : data.url;
      setEditAvatarUrl(apiUrl);
      if (profile) {
        const updated = { ...profile, avatar_url: data.pathname || data.url };
        setProfile(updated as Profile);
      }
      toast.success("Photo updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload photo");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Handle avatar upload (legacy — kept for backward compat, now routes through cropper)
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
      
      // Refresh the user context so sidebar updates
      await refreshProfile();
      
      toast.success("Photo uploaded successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload photo");
    } finally {
      setUploadingAvatar(false);
      // Reset the input
      e.target.value = "";
    }
  };

  // Handle tutor settings save
  const handleSaveTutorSettings = async () => {
    setSavingTutor(true);

    try {
      const result = await updateTutorInfo({
        bio: tutorBio.trim() || null,
        hourly_rate: hourlyRate,
        years_experience: yearsExperience,
        specialization_ids: selectedSpecializations,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success("Tutor settings updated successfully");
      setTutorSettingsOpen(false);
      await refreshProfile();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update tutor settings");
    } finally {
      setSavingTutor(false);
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
      
      // Refresh the user context so sidebar updates
      await refreshProfile();
      
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
      membership_number: editMembershipNumber.trim() || null,
      degree_program: !isTutor ? editDegreeProgram.trim() || null : null,
      year_level: !isTutor ? parseInt(editYearLevel) || null : null,
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
        degree_program: updateData.degree_program,
        year_level: updateData.year_level,
      } : null);
      
      toast.success("Profile updated successfully");
      setEditOpen(false);
      await refreshProfile();
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
    if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) {
      return avatarUrl;
    }
    if (avatarUrl.startsWith("avatars/")) {
      return `/api/avatar?pathname=${encodeURIComponent(avatarUrl)}`;
    }
    if (avatarUrl.startsWith("data:")) {
      return avatarUrl;
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-1">
          <QrIdCard 
            profile={{...profile, hs_designations: designations}} 
            role={roleName} 
          />
        </div>
        
        <div className="lg:col-span-2 space-y-6">
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

                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Award className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Student ID Number</p>
                    <p className="text-sm text-muted-foreground">{profile.membership_number || "Not set"}</p>
                  </div>
                </div>

                {!isTutor && (
                  <>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <BookOpen className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Degree Program</p>
                        <p className="text-sm text-muted-foreground">{profile.degree_program || "Not set"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Star className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Year Level</p>
                        <p className="text-sm text-muted-foreground">{profile.year_level || "Not set"}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tutor Settings */}
          {isTutor && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Tutor Settings
                  </CardTitle>
                  <CardDescription>Manage your tutoring profile and specializations</CardDescription>
                </div>
                <Button
                  onClick={() => setTutorSettingsOpen(true)}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Bio</p>
                  <p className="text-sm text-muted-foreground">{tutorBio || "Not set"}</p>
                </div>
                {hourlyRate && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Hourly Rate</p>
                    <p className="text-sm text-muted-foreground">${hourlyRate}/hour</p>
                  </div>
                )}
                {yearsExperience && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Years of Experience</p>
                    <p className="text-sm text-muted-foreground">{yearsExperience} years</p>
                  </div>
                )}
                {specializations.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Specializations</p>
                    <div className="flex flex-wrap gap-2">
                      {specializations.map(spec => (
                        <Badge key={spec.id} variant="secondary">
                          {spec.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Honor Society Designation History */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Honor Society Designation
                </CardTitle>
                <CardDescription>Your current and past designations in the Honor Society</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  setEditingDesignation(null);
                  setDesigType("member");
                  setDesigPosition("");
                  setDesigAcademicYear("2024-2025");
                  setDesigIsCurrent(designations.length === 0);
                  setDesignationDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </CardHeader>
            <CardContent>
              {designations.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No designations added yet.</p>
              ) : (
                <div className="space-y-3">
                  {[...designations]
                    .sort((a, b) => {
                      if (a.is_current && !b.is_current) return -1;
                      if (!a.is_current && b.is_current) return 1;
                      return b.academic_year.localeCompare(a.academic_year);
                    })
                    .map((d) => (
                      <div
                        key={d.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          d.is_current ? "border-primary/30 bg-primary/5" : "border-muted bg-muted/20"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            d.designation === "esas_scholar" ? "bg-amber-500/10 text-amber-500" :
                            d.designation === "officer" ? "bg-blue-500/10 text-blue-500" :
                            d.designation === "administrator" ? "bg-red-500/10 text-red-500" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {d.designation === "officer" ? <Shield className="h-4 w-4" /> :
                             d.designation === "esas_scholar" ? <GraduationCap className="h-4 w-4" /> :
                             d.designation === "administrator" ? <Crown className="h-4 w-4" /> :
                             <Award className="h-4 w-4" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm capitalize">
                                {d.designation === "esas_scholar" ? "ESAS Scholar" :
                                 d.designation === "officer" ? (d.position || "Officer") :
                                 d.designation.charAt(0).toUpperCase() + d.designation.slice(1)}
                              </span>
                              {d.is_current && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Current</Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">AY {d.academic_year}</span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost" size="sm" className="h-7 px-2"
                            onClick={() => {
                              setEditingDesignation(d);
                              setDesigType(d.designation);
                              setDesigPosition(d.position || "");
                              setDesigAcademicYear(d.academic_year);
                              setDesigIsCurrent(d.is_current);
                              setDesignationDialogOpen(true);
                            }}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost" size="sm"
                            className="h-7 px-2 text-destructive hover:text-destructive"
                            onClick={async () => {
                              const { error } = await supabase.from("hs_designations").delete().eq("id", d.id);
                              if (error) { toast.error("Failed to delete"); }
                              else { setDesignations(prev => prev.filter(x => x.id !== d.id)); toast.success("Removed"); }
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
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
        </div>
      </div>

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
                  onChange={handleAvatarFileSelect}
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

            <div className="space-y-2">
              <Label htmlFor="editMembershipNumber">Student ID Number</Label>
              <Input
                id="editMembershipNumber"
                value={editMembershipNumber}
                onChange={e => setEditMembershipNumber(e.target.value)}
                placeholder="e.g. 21-1234-567"
              />
            </div>

            {!isTutor && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="editDegreeProgram">Degree Program</Label>
                  <Input
                    id="editDegreeProgram"
                    value={editDegreeProgram}
                    onChange={e => setEditDegreeProgram(e.target.value)}
                    placeholder="e.g. BS Computer Science"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editYearLevel">Year Level</Label>
                  <Input
                    id="editYearLevel"
                    type="number"
                    value={editYearLevel}
                    onChange={e => setEditYearLevel(e.target.value)}
                    placeholder="e.g. 1"
                  />
                </div>
              </>
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

      {/* Tutor Settings Dialog */}
      <Dialog open={tutorSettingsOpen} onOpenChange={setTutorSettingsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tutor Settings</DialogTitle>
            <DialogDescription>Update your bio, rate, and specializations</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tutorBio">Bio</Label>
              <textarea
                id="tutorBio"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={tutorBio}
                onChange={e => setTutorBio(e.target.value)}
                placeholder="Tell students about your expertise..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  value={hourlyRate || ""}
                  onChange={e => setHourlyRate(e.target.value ? Number(e.target.value) : null)}
                  placeholder="e.g. 50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearsExperience">Years of Experience</Label>
                <Input
                  id="yearsExperience"
                  type="number"
                  value={yearsExperience || ""}
                  onChange={e => setYearsExperience(e.target.value ? Number(e.target.value) : null)}
                  placeholder="e.g. 5"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTutorSettingsOpen(false)} disabled={savingTutor}>
              Cancel
            </Button>
            <Button onClick={handleSaveTutorSettings} disabled={savingTutor}>
              {savingTutor ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Cropper */}
      {cropperImageSrc && (
        <ImageCropper
          imageSrc={cropperImageSrc}
          open={cropperOpen}
          onClose={() => { setCropperOpen(false); setCropperImageSrc(null); }}
          onCropComplete={handleCroppedUpload}
          cropShape="round"
          aspectRatio={1}
        />
      )}

      {/* Honor Society Designation Dialog */}
      <Dialog open={designationDialogOpen} onOpenChange={setDesignationDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingDesignation ? "Edit Designation" : "Add Designation"}</DialogTitle>
            <DialogDescription>
              {editingDesignation ? "Update your Honor Society designation." : "Add a designation or role you held."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="desigType">Designation Type</Label>
              <Select value={desigType} onValueChange={(v) => setDesigType(v as DesignationType)}>
                <SelectTrigger id="desigType">
                  <SelectValue placeholder="Select designation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="officer">Officer</SelectItem>
                  <SelectItem value="administrator">Administrator</SelectItem>
                  <SelectItem value="esas_scholar">ESAS Scholar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {desigType === "officer" && (
              <div className="grid gap-2">
                <Label htmlFor="desigPosition">Position Title</Label>
                <Input
                  id="desigPosition"
                  value={desigPosition}
                  onChange={(e) => setDesigPosition(e.target.value)}
                  placeholder="e.g. President, Secretary"
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="desigAcademicYear">Academic Year</Label>
              <Input
                id="desigAcademicYear"
                value={desigAcademicYear}
                onChange={(e) => setDesigAcademicYear(e.target.value)}
                placeholder="e.g. 2024-2025"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="desigIsCurrent"
                checked={desigIsCurrent}
                onChange={(e) => setDesigIsCurrent(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="desigIsCurrent" className="font-normal">This is my current designation</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDesignationDialogOpen(false)}>Cancel</Button>
            <Button
              disabled={savingDesignation || (desigType === "officer" && !desigPosition)}
              onClick={async () => {
                setSavingDesignation(true);
                try {
                  if (editingDesignation) {
                    const { error } = await supabase.from("hs_designations").update({
                      designation: desigType,
                      position: desigType === "officer" ? desigPosition : null,
                      academic_year: desigAcademicYear,
                      is_current: desigIsCurrent,
                    }).eq("id", editingDesignation.id);
                    if (error) throw error;
                    setDesignations(prev => prev.map(d =>
                      d.id === editingDesignation.id
                        ? { ...d, designation: desigType, position: desigType === "officer" ? desigPosition : null, academic_year: desigAcademicYear, is_current: desigIsCurrent }
                        : desigIsCurrent ? { ...d, is_current: false } : d
                    ));
                    toast.success("Designation updated");
                  } else {
                    const { data, error } = await supabase.from("hs_designations").insert({
                      user_id: profile?.id,
                      designation: desigType,
                      position: desigType === "officer" ? desigPosition : null,
                      academic_year: desigAcademicYear,
                      is_current: desigIsCurrent,
                    }).select().single();
                    if (error) throw error;
                    setDesignations(prev => desigIsCurrent
                      ? [data, ...prev.map(d => ({ ...d, is_current: false }))]
                      : [data, ...prev]
                    );
                    toast.success("Designation added");
                  }
                  setDesignationDialogOpen(false);
                } catch {
                  toast.error("Failed to save designation");
                } finally {
                  setSavingDesignation(false);
                }
              }}
            >
              {savingDesignation ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
