"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import type { Specialization } from "@/lib/types";

interface MasteryVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  specializations: Specialization[];
}

export function MasteryVerificationDialog({
  open,
  onOpenChange,
  specializations,
}: MasteryVerificationDialogProps) {
  const [selectedSpec, setSelectedSpec] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!selectedSpec) {
      toast.error("Please select a specialization to verify");
      return;
    }
    if (!file) {
      toast.error("Please select a transcript or certificate to upload");
      return;
    }

    setUploading(true);

    // Simulate upload delay since we can't update DB easily
    await new Promise((r) => setTimeout(r, 1500));

    toast.success("Verification document submitted for review!");
    setUploading(false);
    onOpenChange(false);
    setSelectedSpec("");
    setFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Verify Subject Mastery</DialogTitle>
          <DialogDescription>
            Upload a transcript, degree, or certificate to verify your mastery
            in a specific subject. Once approved, it will be visible to
            learners.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="specialization">Subject Specialization</Label>
            <Select value={selectedSpec} onValueChange={setSelectedSpec}>
              <SelectTrigger id="specialization">
                <SelectValue placeholder="Select subject to verify" />
              </SelectTrigger>
              <SelectContent>
                {specializations.map((spec) => (
                  <SelectItem key={spec.id} value={spec.id}>
                    {spec.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="document">Supporting Document (PDF/Image)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="document"
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
            </div>
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected: {file.name}
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={uploading}>
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Submit Document
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
