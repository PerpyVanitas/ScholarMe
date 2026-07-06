"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Profile,
  Specialization,
  HsDesignation,
  DesignationType,
} from "@/lib/types";
import { getLevelTitle, getLevelColor } from "@/lib/utils/gamification";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAvatarUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  Award,
  Edit2,
  Loader2,
  Key,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
  BookOpen,
  Star,
  Crown,
  Shield,
  GraduationCap,
  Plus,
} from "lucide-react";
import { ImageCropper } from "@/components/image-cropper";
import { useRouter } from "next/navigation";
import {
  updateProfile,
  UpdateProfileData,
  updateTutorInfo,
  ensureProfile,
} from "./actions";
import { useUser } from "@/lib/user-context";
import { QrIdCard } from "@/features/auth/components/qr-id-card";
import { getRoleName } from "@/lib/utils/roles";

// Import modular components
import { ProfileEditDialog } from "./components/profile-edit-dialog";
import { TutorSettingsDialog } from "./components/tutor-settings-dialog";
import { HonorSocietyDesignationDialog } from "./components/honor-society-designation-dialog";

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
  const [selectedSpecializations, setSelectedSpecializations] = useState<
    string[]
  >([]);
  const [allSpecializations, setAllSpecializations] = useState<
    Specialization[]
  >([]);
  const [tutorData, setTutorData] = useState<Record<string, unknown> | null>(
    null,
  );
  const [savingTutor, setSavingTutor] = useState(false);

  const isTutor = roleName === "tutor";

  // Designation state
  const [designations, setDesignations] = useState<HsDesignation[]>([]);
  const [designationDialogOpen, setDesignationDialogOpen] = useState(false);
  const [editingDesignation, setEditingDesignation] =
    useState<HsDesignation | null>(null);
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
        console.warn(
          "Profile fetch returned error or no data, healing:",
          error,
        );
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
        if (
          user.user_metadata?.role_name === "administrator" ||
          user.user_metadata?.role === "administrator"
        ) {
          fallbackRole = "administrator";
        } else if (
          user.user_metadata?.role_name === "tutor" ||
          user.user_metadata?.role === "tutor"
        ) {
          fallbackRole = "tutor";
        }

        const fullNameStr =
          user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
        let derivedFirstName = user.user_metadata?.first_name || "";
        let derivedLastName = user.user_metadata?.last_name || "";
        if (!derivedFirstName && !derivedLastName) {
          const parts = fullNameStr.trim().split(/\s+/);
          derivedFirstName = parts[0] || "";
          derivedLastName = parts.slice(1).join(" ") || "";
        }

        const fallbackProfile: Record<string, unknown> = {
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
          roles: { name: fallbackRole },
        };

        setProfile(fallbackProfile as unknown as Profile);
        setRoleName(fallbackRole);
      } else {
        setProfile(data);
        const loadedRole = getRoleName(data);
        setRoleName(loadedRole);

        if (loadedRole === "tutor") {
          const { data: allSpecs } = await supabase
            .from("specializations")
            .select("id, name");
          if (allSpecs) setAllSpecializations(allSpecs);

          const { data: tutorInfo } = await supabase
            .from("tutors")
            .select(
              "id, bio, hourly_rate, years_experience, tutor_specializations(specializations(id, name))",
            )
            .eq("user_id", user.id)
            .single();

          if (tutorInfo) {
            setTutorData(tutorInfo);
            setTutorBio(tutorInfo.bio || "");
            setHourlyRate(tutorInfo.hourly_rate);
            setYearsExperience(tutorInfo.years_experience);

            if (tutorInfo.tutor_specializations) {
              const specs = tutorInfo.tutor_specializations
                .map((ts: { specializations: unknown | unknown[] }) => {
                  const s = Array.isArray(ts.specializations)
                    ? ts.specializations
                    : [];
                  return s.length > 0 ? s[0] : null;
                })
                .filter(Boolean);
              setSpecializations(specs);
              setSelectedSpecializations(
                specs.map((s: { id: string }) => s.id),
              );
            }
          }
        }

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

  const openEditModal = useCallback(() => {
    if (!profile) return;

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
    if (profile.avatar_url?.startsWith("avatars/")) {
      setEditAvatarUrl(
        `/api/avatar?pathname=${encodeURIComponent(profile.avatar_url)}`,
      );
    } else {
      setEditAvatarUrl(profile.avatar_url || null);
    }
    setEditOpen(true);
  }, [profile]);

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
    e.target.value = "";
  };

  const handleCroppedUpload = async (blob: Blob) => {
    setCropperOpen(false);
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", blob, "avatar.jpg");
      const res = await fetch("/api/avatar", {
        method: "POST",
        body: formData,
      });
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
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to upload photo",
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveTutorSettings = async () => {
    setSavingTutor(true);
    try {
      const result = await updateTutorInfo({
        bio: tutorBio.trim() || null,
        hourly_rate: hourlyRate,
        years_experience: yearsExperience,
        specialization_ids: selectedSpecializations,
      });
      if (!result.success) throw new Error(result.error);
      toast.success("Tutor settings updated successfully");
      setTutorSettingsOpen(false);
      await refreshProfile();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update tutor settings",
      );
    } finally {
      setSavingTutor(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setUploadingAvatar(true);
    try {
      const res = await fetch("/api/avatar", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove photo");
      }
      setEditAvatarUrl(null);
      setProfile((prev) => (prev ? { ...prev, avatar_url: null } : null));
      await refreshProfile();
      toast.success("Photo removed");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove photo",
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

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
      setProfile((prev) =>
        prev
          ? {
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
            }
          : null,
      );
      toast.success("Profile updated successfully");
      setEditOpen(false);
      await refreshProfile();
    } else {
      toast.error(result.error || "Failed to update profile");
    }
    setSaving(false);
  };

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

  const handleSaveDesignation = async () => {
    setSavingDesignation(true);
    try {
      if (editingDesignation) {
        const { error } = await supabase
          .from("hs_designations")
          .update({
            designation: desigType,
            position: desigType === "officer" ? desigPosition : null,
            academic_year: desigAcademicYear,
            is_current: desigIsCurrent,
          })
          .eq("id", editingDesignation.id);
        if (error) throw error;
        setDesignations((prev) =>
          prev.map((d) =>
            d.id === editingDesignation.id
              ? {
                  ...d,
                  designation: desigType,
                  position: desigType === "officer" ? desigPosition : null,
                  academic_year: desigAcademicYear,
                  is_current: desigIsCurrent,
                }
              : desigIsCurrent
                ? { ...d, is_current: false }
                : d,
          ),
        );
        toast.success("Designation updated");
      } else {
        const { data, error } = await supabase
          .from("hs_designations")
          .insert({
            user_id: profile?.id,
            designation: desigType,
            position: desigType === "officer" ? desigPosition : null,
            academic_year: desigAcademicYear,
            is_current: desigIsCurrent,
          })
          .select()
          .single();
        if (error) throw error;
        setDesignations((prev) =>
          desigIsCurrent
            ? [data, ...prev.map((d) => ({ ...d, is_current: false }))]
            : [data, ...prev],
        );
        toast.success("Designation added");
      }
      setDesignationDialogOpen(false);
    } catch {
      toast.error("Failed to save designation");
    } finally {
      setSavingDesignation(false);
    }
  };

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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl py-8 space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Profile not found. Please try logging in again.
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayName =
    profile.full_name ||
    `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
    "User";

  return (
    <div className="container mx-auto max-w-4xl py-8 space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Avatar
              className={`h-24 w-24 border-4 shadow-lg ${getLevelColor(profile.current_level || 1)}`}
            >
              <AvatarImage
                src={getAvatarUrl(profile.avatar_url)}
                alt={displayName}
              />
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h1 className="text-2xl font-bold">{displayName}</h1>
                <Badge
                  variant="secondary"
                  className="w-fit mx-auto sm:mx-0 capitalize"
                >
                  {roleName}
                </Badge>
                <Badge
                  className={`w-fit mx-auto sm:mx-0 ${getLevelColor(profile.current_level || 1).split(" ")[1]}`}
                >
                  Level {profile.current_level || 1} •{" "}
                  {getLevelTitle(profile.current_level || 1)}
                </Badge>
              </div>
              <p className="text-muted-foreground">{profile.email}</p>

              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 text-sm font-medium">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-primary">
                  {profile.total_xp || 0} XP Total
                </span>
              </div>

              {specializations.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-2">
                  {specializations.map((spec) => (
                    <Badge key={spec.id} variant="outline">
                      {spec.name}
                    </Badge>
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
            profile={{ ...profile, hs_designations: designations }}
            role={roleName}
          />
        </div>

        <div className="lg:col-span-2 space-y-6">
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
                    <p className="text-sm text-muted-foreground">
                      {displayName}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">
                      {profile.email}
                    </p>
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

          {isTutor && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Tutor Settings
                  </CardTitle>
                  <CardDescription>
                    Manage your tutoring profile and specializations
                  </CardDescription>
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
                  <p className="text-sm text-muted-foreground">
                    {tutorBio || "Not set"}
                  </p>
                </div>
                {hourlyRate && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Hourly Rate</p>
                    <p className="text-sm text-muted-foreground">
                      ${hourlyRate}/hour
                    </p>
                  </div>
                )}
                {yearsExperience && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Years of Experience</p>
                    <p className="text-sm text-muted-foreground">
                      {yearsExperience} years
                    </p>
                  </div>
                )}
                {specializations.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Specializations</p>
                    <div className="flex flex-wrap gap-2">
                      {specializations.map((spec) => (
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Honor Society Designation
                </CardTitle>
                <CardDescription>
                  Your current and past designations in the Honor Society
                </CardDescription>
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
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No designations added yet.
                </p>
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
                          d.is_current
                            ? "border-primary/30 bg-primary/5"
                            : "border-muted bg-muted/20"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-full ${
                              d.designation === "esas_scholar"
                                ? "bg-amber-500/10 text-amber-500"
                                : d.designation === "officer"
                                  ? "bg-blue-500/10 text-blue-500"
                                  : d.designation === "administrator"
                                    ? "bg-red-500/10 text-red-500"
                                    : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {d.designation === "officer" ? (
                              <Shield className="h-4 w-4" />
                            ) : d.designation === "esas_scholar" ? (
                              <GraduationCap className="h-4 w-4" />
                            ) : d.designation === "administrator" ? (
                              <Crown className="h-4 w-4" />
                            ) : (
                              <Award className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm capitalize">
                                {d.designation === "esas_scholar"
                                  ? "ESAS Scholar"
                                  : d.designation === "officer"
                                    ? d.position || "Officer"
                                    : d.designation.charAt(0).toUpperCase() +
                                      d.designation.slice(1)}
                              </span>
                              {d.is_current && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] px-1.5 py-0"
                                >
                                  Current
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              AY {d.academic_year}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
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
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-destructive hover:text-destructive"
                            onClick={async () => {
                              const { error } = await supabase
                                .from("hs_designations")
                                .delete()
                                .eq("id", d.id);
                              if (error) {
                                toast.error("Failed to delete");
                              } else {
                                setDesignations((prev) =>
                                  prev.filter((x) => x.id !== d.id),
                                );
                                toast.success("Removed");
                              }
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
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPasswords ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
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
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type={showPasswords ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                  />
                </div>
              </div>
              {newPassword &&
                confirmPassword &&
                newPassword !== confirmPassword && (
                  <p className="text-sm text-destructive">
                    Passwords do not match
                  </p>
                )}
              <Button
                onClick={handleChangePassword}
                disabled={
                  changingPassword ||
                  !currentPassword ||
                  !newPassword ||
                  newPassword !== confirmPassword
                }
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

          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible actions for your account
              </CardDescription>
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

      <ProfileEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        saving={saving}
        editFirstName={editFirstName}
        setEditFirstName={setEditFirstName}
        editLastName={editLastName}
        setEditLastName={setEditLastName}
        editPhone={editPhone}
        setEditPhone={setEditPhone}
        editBirthdate={editBirthdate}
        setEditBirthdate={setEditBirthdate}
        editMembershipNumber={editMembershipNumber}
        setEditMembershipNumber={setEditMembershipNumber}
        editDegreeProgram={editDegreeProgram}
        setEditDegreeProgram={setEditDegreeProgram}
        editYearLevel={editYearLevel}
        setEditYearLevel={setEditYearLevel}
        editAvatarUrl={editAvatarUrl}
        uploadingAvatar={uploadingAvatar}
        isTutor={isTutor}
        displayName={displayName}
        getInitials={getInitials}
        handleAvatarFileSelect={handleAvatarFileSelect}
        handleRemoveAvatar={handleRemoveAvatar}
        handleSaveProfile={handleSaveProfile}
      />

      <TutorSettingsDialog
        open={tutorSettingsOpen}
        onOpenChange={setTutorSettingsOpen}
        tutorBio={tutorBio}
        setTutorBio={setTutorBio}
        hourlyRate={hourlyRate}
        setHourlyRate={setHourlyRate}
        yearsExperience={yearsExperience}
        setYearsExperience={setYearsExperience}
        savingTutor={savingTutor}
        handleSaveTutorSettings={handleSaveTutorSettings}
      />

      {cropperImageSrc && (
        <ImageCropper
          imageSrc={cropperImageSrc}
          open={cropperOpen}
          onClose={() => {
            setCropperOpen(false);
            setCropperImageSrc(null);
          }}
          onCropComplete={handleCroppedUpload}
          cropShape="round"
          aspectRatio={1}
        />
      )}

      <HonorSocietyDesignationDialog
        open={designationDialogOpen}
        onOpenChange={setDesignationDialogOpen}
        editingDesignation={editingDesignation}
        desigType={desigType}
        setDesigType={setDesigType}
        desigPosition={desigPosition}
        setDesigPosition={setDesigPosition}
        desigAcademicYear={desigAcademicYear}
        setDesigAcademicYear={setDesigAcademicYear}
        desigIsCurrent={desigIsCurrent}
        setDesigIsCurrent={setDesigIsCurrent}
        savingDesignation={savingDesignation}
        roleName={roleName}
        handleSaveDesignation={handleSaveDesignation}
      />
    </div>
  );
}
