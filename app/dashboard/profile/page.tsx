"use client";

import { getLevelTitle, getLevelColor } from "@/lib/utils/gamification";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAvatarUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { QrIdCard } from "@/features/auth/components/qr-id-card";
import { hasAnyRole } from "@/lib/utils/roles";

// Import modular components
import { ProfileEditDialog } from "./components/profile-edit-dialog";
import { TutorSettingsDialog } from "./components/tutor-settings-dialog";
import { HonorSocietyDesignationDialog } from "./components/honor-society-designation-dialog";
import { MasteryVerificationDialog } from "./components/mastery-verification-dialog";
import { AchievementsCard } from "./components/achievements-card";
import { SkillTree } from "./components/skill-tree";
import { ProfileHeader } from "./components/profile-header";
import { ProfileInfoCard } from "./components/profile-info-card";
import { TutorSettingsCard } from "./components/tutor-settings-card";
import dynamic from "next/dynamic";
import { useProfilePage } from "@/features/profiles/hooks/use-profile-page";

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
  const {
    profile,
    roleName,
    loading,
    specializations,
    editOpen,
    saving,
    editFirstName,
    setEditFirstName,
    editLastName,
    setEditLastName,
    editPhone,
    setEditPhone,
    editBirthdate,
    setEditBirthdate,
    editMembershipNumber,
    setEditMembershipNumber,
    editUniqueIdNumber,
    setEditUniqueIdNumber,
    editDegreeProgram,
    setEditDegreeProgram,
    editYearLevel,
    setEditYearLevel,
    editAvatarUrl,
    editPronouns,
    setEditPronouns,
    editStatusMessage,
    setEditStatusMessage,
    editGithubUrl,
    setEditGithubUrl,
    editLinkedinUrl,
    setEditLinkedinUrl,
    editIsPrivate,
    setEditIsPrivate,
    editAcademicYearJoined,
    setEditAcademicYearJoined,
    uploadingAvatar,
    tutorSettingsOpen,
    setTutorSettingsOpen,
    tutorBio,
    setTutorBio,
    hourlyRate,
    setHourlyRate,
    yearsExperience,
    setYearsExperience,
    isPaused,
    setIsPaused,
    calendarSyncEnabled,
    setCalendarSyncEnabled,
    autoApprovePastLearners,
    setAutoApprovePastLearners,
    savingTutor,
    isTutor,
    designations,
    setDesignations,
    designationDialogOpen,
    setDesignationDialogOpen,
    masteryVerificationOpen,
    setMasteryVerificationOpen,
    editingDesignation,
    setEditingDesignation,
    desigType,
    setDesigType,
    desigPosition,
    setDesigPosition,
    desigAcademicYear,
    setDesigAcademicYear,
    desigIsCurrent,
    setDesigIsCurrent,
    savingDesignation,
    cropperOpen,
    setCropperOpen,
    cropperImageSrc,
    setCropperImageSrc,
    openEditModal,
    handleEditOpenChange,
    handleTutorSettingsOpenChange,
    handleAvatarFileSelect,
    handleCroppedUpload,
    handleSaveTutorSettings,
    handleRemoveAvatar,
    handleSaveProfile,
    handleSaveDesignation,
    formatDate,
    getInitials,
    displayName,
  } = useProfilePage();

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl py-8 space-y-6" data-testid="loading-skeleton">
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

  return (
    <div className="container mx-auto max-w-4xl py-8 space-y-6">
      {/* Profile Header */}
      <div
        data-tour-step="14"
        data-tour-title="Your Profile"
        data-tour-description="This is your public profile header. Click the pencil icon to edit your basic information."
        data-tour-side="bottom"
      >
        <ProfileHeader
          profile={profile}
          displayName={displayName}
          roleName={roleName}
          specializations={specializations}
          openEditModal={openEditModal}
          getInitials={getInitials}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div
          className="lg:col-span-1"
          data-tour-step="15"
          data-tour-title="Digital ID Card"
          data-tour-description="Your scannable QR ID card updates automatically with your current level and designations."
          data-tour-side="right"
        >
          <QrIdCard
            profile={{ ...profile, hs_designations: designations }}
            role={roleName}
          />
        </div>

        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="mb-6 grid w-full grid-cols-2 md:grid-cols-4 max-w-[600px] h-auto p-1">
              <TabsTrigger value="general" className="py-2">General</TabsTrigger>
              <TabsTrigger value="academic" className="py-2">Academic</TabsTrigger>
              {isTutor && <TabsTrigger value="tutor" className="py-2">Tutor</TabsTrigger>}
              <TabsTrigger value="security" className="py-2">Security</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="mt-0">
              <ProfileInfoCard
                profile={profile}
                displayName={displayName}
                isTutor={isTutor}
                formatDate={formatDate}
              />
            </TabsContent>

            {isTutor && (
              <TabsContent value="tutor" className="mt-0">
                <TutorSettingsCard
                  tutorBio={tutorBio}
                  hourlyRate={hourlyRate}
                  yearsExperience={yearsExperience}
                  specializations={specializations}
                  isPaused={isPaused}
                  setIsPaused={setIsPaused}
                  setTutorSettingsOpen={setTutorSettingsOpen}
                  setMasteryVerificationOpen={setMasteryVerificationOpen}
                />
              </TabsContent>
            )}

            <TabsContent value="academic" className="mt-0 space-y-6">
              <DesignationCard
                designations={designations}
                setDesignations={setDesignations}
                setEditingDesignation={setEditingDesignation}
                // @ts-expect-error: Strict unknown type check
                setDesigType={setDesigType}
                setDesigPosition={setDesigPosition}
                setDesigAcademicYear={setDesigAcademicYear}
                setDesigIsCurrent={setDesigIsCurrent}
                setDesignationDialogOpen={setDesignationDialogOpen}
              />
              <AchievementsCard />
              {hasAnyRole(roleName, ["administrator", "super_admin"]) && (
                <SkillTree profile={profile} />
              )}
            </TabsContent>

            <TabsContent value="security" className="mt-0">
              <SecuritySettings />
            </TabsContent>
          </Tabs>
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
        editUniqueIdNumber={editUniqueIdNumber}
        setEditUniqueIdNumber={setEditUniqueIdNumber}
        editDegreeProgram={editDegreeProgram}
        setEditDegreeProgram={setEditDegreeProgram}
        editYearLevel={editYearLevel}
        setEditYearLevel={setEditYearLevel}
        editAcademicYearJoined={editAcademicYearJoined}
        setEditAcademicYearJoined={setEditAcademicYearJoined}
        editAvatarUrl={editAvatarUrl}
        editPronouns={editPronouns}
        setEditPronouns={setEditPronouns}
        editStatusMessage={editStatusMessage}
        setEditStatusMessage={setEditStatusMessage}
        editGithubUrl={editGithubUrl}
        setEditGithubUrl={setEditGithubUrl}
        editLinkedinUrl={editLinkedinUrl}
        setEditLinkedinUrl={setEditLinkedinUrl}
        editIsPrivate={editIsPrivate}
        setEditIsPrivate={setEditIsPrivate}
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
