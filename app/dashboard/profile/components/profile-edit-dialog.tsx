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
  editDegreeProgram: string;
  setEditDegreeProgram: (v: string) => void;
  editYearLevel: string;
  setEditYearLevel: (v: string) => void;
  editAvatarUrl: string | null;
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
  editDegreeProgram,
  setEditDegreeProgram,
  editYearLevel,
  setEditYearLevel,
  editAvatarUrl,
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
            <Label htmlFor="editBirthdate">Birthday</Label>
            <Input
              id="editBirthdate"
              type="date"
              value={editBirthdate}
              onChange={(e) => setEditBirthdate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="editMembershipNumber">Student ID Number</Label>
            <Input
              id="editMembershipNumber"
              value={editMembershipNumber}
              onChange={(e) => setEditMembershipNumber(e.target.value)}
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
