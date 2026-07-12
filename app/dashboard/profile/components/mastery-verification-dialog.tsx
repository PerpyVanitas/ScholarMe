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
import { Loader2, Upload, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import type { Specialization } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

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
  const [submitted, setSubmitted] = useState(false);

  const handleUpload = async () => {
    if (!selectedSpec) {
      toast.error("Please select a specialization to verify");
      return;
    }
    if (!file) {
      toast.error("Please select a transcript or certificate to upload");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10 MB");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: tutorRow } = await supabase
        .from("tutors")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!tutorRow)
        throw new Error(
          "Tutor profile not found. Please complete your profile first.",
        );

      const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
      const storagePath = `verifications/${tutorRow.id}/${selectedSpec}-${Date.now()}.${ext}`;

      const { error: storageError } = await supabase.storage
        .from("resources")
        .upload(storagePath, file, { upsert: true, contentType: file.type });

      if (storageError) throw storageError;

      const docUrl = `${SUPABASE_URL}/storage/v1/object/public/resources/${storagePath}`;

      const { error: upsertError } = await supabase
        .from("tutor_specializations")
        .upsert(
          {
            tutor_id: tutorRow.id,
            specialization_id: selectedSpec,
            verification_document_url: docUrl,
            verification_status: "pending",
            submitted_at: new Date().toISOString(),
          },
          { onConflict: "tutor_id,specialization_id" },
        );

      if (upsertError) throw upsertError;

      setSubmitted(true);
      toast.success(
        "Verification request submitted! An admin will review your document.",
      );
    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : String(err) || "Submission failed. Please try again.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedSpec("");
    setFile(null);
    setSubmitted(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Verify Subject Mastery</DialogTitle>
          <DialogDescription>
            Upload a transcript, degree, or certificate to verify your mastery
            in a specific subject. Once approved, it will be visible to
            learners.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <CheckCircle className="h-12 w-12 text-emerald-500" />
            <h3 className="text-base font-semibold">Submission Received!</h3>
            <p className="text-sm text-muted-foreground">
              Your verification document has been submitted. An administrator
              will review it and approve or reject the request.
            </p>
            <Button onClick={handleClose}>Done</Button>
          </div>
        ) : (
          <>
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
                <Label htmlFor="document">
                  Supporting Document (PDF/Image)
                </Label>
                <Input
                  id="document"
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
                {file && (
                  <p className="text-xs text-muted-foreground">
                    Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Max 10 MB. PDF or image files accepted.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleClose}
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
                    Submit for Review
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
