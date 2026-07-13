"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Camera, X } from "lucide-react";

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saving: boolean;
  editFirstName: string;
  setEditFirstName: (v: string) => void;
  editLastName: string;
  setEditLastName: (v: string) => void;
  editPhone: string;
  setEditPhone: (v: string) => void;
  editBirthdate: string;
  setEditBirthdate: (v: string) => void;
  editMembershipNumber: string;
  setEditMembershipNumber: (v: string) => void;
  editUniqueIdNumber: string;
  setEditUniqueIdNumber: (v: string) => void;
  editDegreeProgram: string;
  setEditDegreeProgram: (v: string) => void;
  editYearLevel: string;
  setEditYearLevel: (v: string) => void;
  editAcademicYearJoined: string;
  setEditAcademicYearJoined: (v: string) => void;
  editAvatarUrl: string | null;
  editPronouns: string;
  setEditPronouns: (v: string) => void;
  editStatusMessage: string;
  setEditStatusMessage: (v: string) => void;
  editGithubUrl: string;
  setEditGithubUrl: (v: string) => void;
  editLinkedinUrl: string;
  setEditLinkedinUrl: (v: string) => void;
  editIsPrivate: boolean;
  setEditIsPrivate: (v: boolean) => void;
  uploadingAvatar: boolean;
  isTutor: boolean;
  displayName: string;
  getInitials: (name: string) => string;
  handleAvatarFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveAvatar: () => void;
  handleSaveProfile: () => void;
}

export function ProfileEditDialog({
  open,
  onOpenChange,
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
  editAcademicYearJoined,
  setEditAcademicYearJoined,
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
  uploadingAvatar,
  isTutor,
  displayName,
  getInitials,
  handleAvatarFileSelect,
  handleRemoveAvatar,
  handleSaveProfile,
}: ProfileEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your personal information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
                onClick={() =>
                  document.getElementById("avatar-upload")?.click()
                }
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
            <p className="text-xs text-muted-foreground">
              JPEG, PNG, GIF or WebP. Max 5MB.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editFirstName">First Name *</Label>
              <Input
                id="editFirstName"
                value={editFirstName}
                onChange={(e) => setEditFirstName(e.target.value)}
                placeholder="First name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editLastName">Last Name *</Label>
              <Input
                id="editLastName"
                value={editLastName}
                onChange={(e) => setEditLastName(e.target.value)}
                placeholder="Last name"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editPhone">Phone Number</Label>
              <Input
                id="editPhone"
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPronouns">Pronouns</Label>
              <Input
                id="editPronouns"
                value={editPronouns}
                onChange={(e) => setEditPronouns(e.target.value)}
                placeholder="e.g. she/her, they/them"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="editStatusMessage">Status Message</Label>
            <Input
              id="editStatusMessage"
              value={editStatusMessage}
              onChange={(e) => setEditStatusMessage(e.target.value)}
              placeholder="What's on your mind?"
              maxLength={50}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editGithubUrl">GitHub URL</Label>
              <Input
                id="editGithubUrl"
                value={editGithubUrl}
                onChange={(e) => setEditGithubUrl(e.target.value)}
                placeholder="https://github.com/username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editLinkedinUrl">LinkedIn URL</Label>
              <Input
                id="editLinkedinUrl"
                value={editLinkedinUrl}
                onChange={(e) => setEditLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/username"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="editBirthdate">Birthday</Label>
            <Input
              id="editBirthdate"
              type="date"
              value={editBirthdate}
              onChange={(e) => setEditBirthdate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="editAcademicYearJoined">Academic Year Joined</Label>
            <select
              id="editAcademicYearJoined"
              value={editAcademicYearJoined}
              onChange={(e) => setEditAcademicYearJoined(e.target.value)}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editMembershipNumber">Student ID Number</Label>
              <Input
                id="editMembershipNumber"
                value={editMembershipNumber}
                onChange={(e) => setEditMembershipNumber(e.target.value)}
                placeholder="e.g. 21-1234-567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editUniqueIdNumber">Honor Society ID</Label>
              <Input
                id="editUniqueIdNumber"
                value={editUniqueIdNumber}
                onChange={(e) => setEditUniqueIdNumber(e.target.value)}
                placeholder="e.g. 24-XXXX-XXX"
              />
            </div>
          </div>

          {!isTutor && (
            <>
              <div className="space-y-2">
                <Label htmlFor="editDegreeProgram">Degree Program</Label>
                <Input
                  id="editDegreeProgram"
                  value={editDegreeProgram}
                  onChange={(e) => setEditDegreeProgram(e.target.value)}
                  placeholder="e.g. BS Computer Science"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editYearLevel">Year Level</Label>
                <Input
                  id="editYearLevel"
                  type="number"
                  value={editYearLevel}
                  onChange={(e) => setEditYearLevel(e.target.value)}
                  placeholder="e.g. 1"
                />
              </div>
            </>
          )}

          <div className="flex items-center space-x-2 pt-4 pb-2">
            <Switch
              id="editIsPrivate"
              checked={editIsPrivate}
              onCheckedChange={setEditIsPrivate}
            />
            <Label htmlFor="editIsPrivate" className="flex flex-col space-y-1">
              <span>Private Profile</span>
              <span className="font-normal text-xs text-muted-foreground">
                Hide your profile from the public directory. Tutors will still
                appear on the Tutors page.
              </span>
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
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
  );
}
