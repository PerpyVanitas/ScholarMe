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
  ShieldCheck,
  GraduationCap,
  Plus,
  Github,
  Linkedin,
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
import { roleNameFromUser } from "@/features/profiles/api/db";

// Import modular components
import { ProfileEditDialog } from "./components/profile-edit-dialog";
import { TutorSettingsDialog } from "./components/tutor-settings-dialog";
import { HonorSocietyDesignationDialog } from "./components/honor-society-designation-dialog";
import { MasteryVerificationDialog } from "./components/mastery-verification-dialog";
import { AchievementsCard } from "./components/achievements-card";
import dynamic from "next/dynamic";

const DesignationCard = dynamic(
  () =>
    import("./components/designation-card").then((mod) => mod.DesignationCard),
  { ssr: false },
);

const SecuritySettings = dynamic(
  () =>
    import("./components/security-settings").then(
      (mod) => mod.SecuritySettings,
    ),
  { ssr: false },
);

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
  const [editPronouns, setEditPronouns] = useState("");
  const [editStatusMessage, setEditStatusMessage] = useState("");
  const [editGithubUrl, setEditGithubUrl] = useState("");
  const [editLinkedinUrl, setEditLinkedinUrl] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Tutor settings state
  const [tutorSettingsOpen, setTutorSettingsOpen] = useState(false);
  const [tutorBio, setTutorBio] = useState("");
  const [hourlyRate, setHourlyRate] = useState<number | null>(null);
  const [yearsExperience, setYearsExperience] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [calendarSyncEnabled, setCalendarSyncEnabled] = useState(false);
  const [autoApprovePastLearners, setAutoApprovePastLearners] = useState(false);
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
  const [masteryVerificationOpen, setMasteryVerificationOpen] = useState(false);
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
        .select(
          "id, first_name, last_name, full_name, email, phone_number, birthdate, date_of_birth, membership_number, degree_program, year_level, total_xp, current_level, avatar_url, pronouns, status_message, social_links, created_at, roles(name)",
        )
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
            .select(
              "id, first_name, last_name, full_name, email, phone_number, birthdate, date_of_birth, membership_number, degree_program, year_level, total_xp, current_level, avatar_url, pronouns, status_message, social_links, created_at, roles(name)",
            )
            .eq("id", user.id)
            .maybeSingle();
          if (healed) {
            setProfile(healed as unknown as Profile);
            setRoleName(getRoleName(healed as unknown as Profile));
            setLoading(false);
            return;
          }
        }

        const fallbackRole = roleNameFromUser(user);

        const fullNameStr =
          user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
        let derivedFirstName = user.user_metadata?.first_name || "";
        let derivedLastName = user.user_metadata?.last_name || "";
        if (!derivedFirstName && !derivedLastName) {
          const parts = fullNameStr.trim().split(/\s+/);
          derivedFirstName = parts[0] || "";
          derivedLastName = parts.slice(1).join(" ") || "";
        }

        const fallbackProfile: Profile = {
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
          roles: [{ id: "fallback-role-id", name: fallbackRole }],
        };

        setProfile(fallbackProfile);
        setRoleName(fallbackRole);
      } else {
        setProfile(data as unknown as Profile);
        const loadedRole = getRoleName(data as unknown as Profile);
        setRoleName(loadedRole);

        if (loadedRole === "tutor") {
          const { data: allSpecs } = await supabase
            .from("specializations")
            .select("id, name");
          if (allSpecs) setAllSpecializations(allSpecs);

          const { data: tutorInfo } = await supabase
            .from("tutors")
            .select(
              "id, bio, hourly_rate, years_experience, is_paused, calendar_sync_enabled, auto_approve_past_learners, tutor_specializations(specializations(id, name))",
            )
            .eq("user_id", user.id)
            .single();

          if (tutorInfo) {
            setTutorData(tutorInfo);
            setTutorBio(tutorInfo.bio || "");
            setHourlyRate(tutorInfo.hourly_rate);
            setYearsExperience(tutorInfo.years_experience);
            setIsPaused(!!tutorInfo.is_paused);
            setCalendarSyncEnabled(!!tutorInfo.calendar_sync_enabled);
            setAutoApprovePastLearners(!!tutorInfo.auto_approve_past_learners);

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
          .select(
            "id, user_id, designation, position, academic_year, is_current, created_at",
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (desigData) setDesignations(desigData as HsDesignation[]);
      }
      setLoading(false);
    }

    loadProfile();
  }, [supabase, router]);

  const getInitialNames = useCallback((prof: Profile) => {
    let fn = prof.first_name || "";
    let ln = prof.last_name || "";
    if ((!fn || !ln) && prof.full_name) {
      const parts = prof.full_name.trim().split(/\s+/);
      fn = fn || parts[0] || "";
      ln = ln || parts.slice(1).join(" ") || "";
    }
    return { fn, ln };
  }, []);

  const openEditModal = useCallback(() => {
    if (!profile) return;

    const { fn, ln } = getInitialNames(profile);

    setEditFirstName(fn);
    setEditLastName(ln);
    setEditPhone(profile.phone_number || "");
    setEditBirthdate(profile.birthdate || profile.date_of_birth || "");
    setEditMembershipNumber(profile.membership_number || "");
    setEditDegreeProgram(profile.degree_program || "");
    setEditYearLevel(profile.year_level?.toString() || "");
    setEditPronouns(profile.pronouns || "");
    setEditStatusMessage(profile.status_message || "");
    setEditGithubUrl(profile.social_links?.github || "");
    setEditLinkedinUrl(profile.social_links?.linkedin || "");
    if (profile.avatar_url?.startsWith("avatars/")) {
      setEditAvatarUrl(
        `/api/avatar?pathname=${encodeURIComponent(profile.avatar_url)}`,
      );
    } else {
      setEditAvatarUrl(profile.avatar_url || null);
    }
    setEditOpen(true);
  }, [profile, getInitialNames]);

  const handleEditOpenChange = (open: boolean) => {
    if (open) {
      setEditOpen(true);
      return;
    }
    if (profile) {
      const { fn, ln } = getInitialNames(profile);
      const hasUnsaved =
        editFirstName.trim() !== fn ||
        editLastName.trim() !== ln ||
        editPhone.trim() !== (profile.phone_number || "") ||
        (editBirthdate || "") !==
          (profile.birthdate || profile.date_of_birth || "") ||
        editMembershipNumber.trim() !== (profile.membership_number || "") ||
        editDegreeProgram.trim() !== (profile.degree_program || "") ||
        editYearLevel !== (profile.year_level?.toString() || "") ||
        editPronouns.trim() !== (profile.pronouns || "") ||
        editStatusMessage.trim() !== (profile.status_message || "") ||
        editGithubUrl.trim() !== (profile.social_links?.github || "") ||
        editLinkedinUrl.trim() !== (profile.social_links?.linkedin || "");

      if (hasUnsaved) {
        if (
          !window.confirm(
            "You have unsaved changes. Are you sure you want to close?",
          )
        ) {
          return;
        }
      }
    }
    setEditOpen(false);
  };

  const handleTutorSettingsOpenChange = (open: boolean) => {
    if (open) {
      setTutorSettingsOpen(true);
      return;
    }
    if (tutorData) {
      const hasUnsaved =
        tutorBio.trim() !== (tutorData.bio || "") ||
        hourlyRate !== tutorData.hourly_rate ||
        yearsExperience !== tutorData.years_experience ||
        isPaused !== !!tutorData.is_paused ||
        calendarSyncEnabled !== !!tutorData.calendar_sync_enabled ||
        autoApprovePastLearners !== !!tutorData.auto_approve_past_learners;

      if (hasUnsaved) {
        if (
          !window.confirm(
            "You have unsaved changes. Are you sure you want to close?",
          )
        ) {
          return;
        }
      }
    }
    setTutorSettingsOpen(false);
  };

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
        is_paused: isPaused,
        calendar_sync_enabled: calendarSyncEnabled,
        auto_approve_past_learners: autoApprovePastLearners,
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
      pronouns: editPronouns.trim() || null,
      status_message: editStatusMessage.trim() || null,
      social_links: {
        github: editGithubUrl.trim(),
        linkedin: editLinkedinUrl.trim(),
      },
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
                <h1 className="text-2xl font-bold">
                  {displayName}
                  {profile.pronouns && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      ({profile.pronouns})
                    </span>
                  )}
                </h1>
                <Badge
                  variant="secondary"
                  className="w-fit mx-auto sm:mx-0 capitalize"
                >
                  {roleName}
                </Badge>
                <Badge
                  className={`w-fit mx-auto sm:mx-0 ${getLevelColor(profile.current_level || 1)}`}
                >
                  Level {profile.current_level || 1} •{" "}
                  {getLevelTitle(profile.current_level || 1)}
                </Badge>
              </div>
              <p className="text-muted-foreground">{profile.email}</p>
              {profile.status_message && (
                <p className="text-sm italic text-foreground/80 mt-1">
                  "{profile.status_message}"
                </p>
              )}

              <div className="flex items-center justify-center sm:justify-start gap-4 mt-2">
                {profile.social_links?.github && (
                  <a
                    href={profile.social_links.github}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Github className="h-5 w-5" />
                  </a>
                )}
                {profile.social_links?.linkedin && (
                  <a
                    href={profile.social_links.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                )}
              </div>

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
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Specializations</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMasteryVerificationOpen(true)}
                      >
                        <ShieldCheck className="mr-2 h-3.5 w-3.5" />
                        Verify Mastery
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
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

          <DesignationCard
            designations={designations}
            setDesignations={setDesignations}
            setEditingDesignation={setEditingDesignation}
            setDesigType={setDesigType}
            setDesigPosition={setDesigPosition}
            setDesigAcademicYear={setDesigAcademicYear}
            setDesigIsCurrent={setDesigIsCurrent}
            setDesignationDialogOpen={setDesignationDialogOpen}
          />
          <AchievementsCard />
          <SecuritySettings />
        </div>
      </div>

      <ProfileEditDialog
        open={editOpen}
        onOpenChange={handleEditOpenChange}
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
        editPronouns={editPronouns}
        setEditPronouns={setEditPronouns}
        editStatusMessage={editStatusMessage}
        setEditStatusMessage={setEditStatusMessage}
        editGithubUrl={editGithubUrl}
        setEditGithubUrl={setEditGithubUrl}
        editLinkedinUrl={editLinkedinUrl}
        setEditLinkedinUrl={setEditLinkedinUrl}
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
        onOpenChange={handleTutorSettingsOpenChange}
        tutorBio={tutorBio}
        setTutorBio={setTutorBio}
        hourlyRate={hourlyRate}
        setHourlyRate={setHourlyRate}
        yearsExperience={yearsExperience}
        setYearsExperience={setYearsExperience}
        isPaused={isPaused}
        setIsPaused={setIsPaused}
        calendarSyncEnabled={calendarSyncEnabled}
        setCalendarSyncEnabled={setCalendarSyncEnabled}
        autoApprovePastLearners={autoApprovePastLearners}
        setAutoApprovePastLearners={setAutoApprovePastLearners}
        savingTutor={savingTutor}
        handleSaveTutorSettings={handleSaveTutorSettings}
      />

      <MasteryVerificationDialog
        open={masteryVerificationOpen}
        onOpenChange={setMasteryVerificationOpen}
        specializations={specializations}
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
