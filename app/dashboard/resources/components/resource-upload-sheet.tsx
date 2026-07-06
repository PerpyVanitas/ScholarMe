"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Loader2, Upload, Info } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  RepoRow,
  ResourceRow,
  ACCEPTED_MIME_TYPES,
  detectFileType,
  MAX_FILE_SIZE,
} from "../types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

interface ResourceUploadSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  role: string;
  repos: RepoRow[];
  initialRepoId?: string;
  onSuccess: (repoId: string, newResource: ResourceRow) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export function ResourceUploadSheet({
  open,
  onOpenChange,
  userId,
  role,
  repos,
  initialRepoId = "",
  onSuccess,
}: ResourceUploadSheetProps) {
  const [uploadRepoId, setUploadRepoId] = useState(initialRepoId);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadFile, setUploadFile] = useState<globalThis.File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize repoId if it changes externally
  useState(() => {
    if (initialRepoId) setUploadRepoId(initialRepoId);
  });

  function closeUploadDialog() {
    onOpenChange(false);
    setUploadTitle("");
    setUploadDesc("");
    setUploadRepoId("");
    setUploadFile(null);
    setIsDragging(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setUploadFile(e.dataTransfer.files[0]);
    }
  }

  async function handleUploadResource() {
    if (!uploadFile || !uploadTitle.trim() || !uploadRepoId) {
      toast.error("Please fill all required fields and select a file.");
      return;
    }
    if (uploadFile.size > MAX_FILE_SIZE) {
      toast.error("File exceeds the 50 MB size limit.");
      return;
    }
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = uploadFile.name.split(".").pop()?.toLowerCase() || "bin";
      const fileTypeKey = detectFileType(uploadFile.name);
      const filePath = `${userId}/${Date.now()}-${uploadTitle.trim().replace(/\s+/g, "_")}.${ext}`;

      const { error: storageErr } = await supabase.storage
        .from("resources")
        .upload(filePath, uploadFile, {
          upsert: false,
          contentType: uploadFile.type,
        });
      if (storageErr) throw storageErr;

      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/resources/${filePath}`;

      const { data, error: insertErr } = await supabase
        .from("resources")
        .insert({
          repository_id: uploadRepoId,
          title: uploadTitle.trim(),
          description: uploadDesc.trim() || null,
          url: publicUrl,
          file_type: fileTypeKey,
          uploaded_by: userId,
        })
        .select(
          "id, repository_id, title, description, url, file_type, uploaded_by, created_at, profiles!resources_uploaded_by_fkey(full_name)",
        )
        .single();
      if (insertErr) throw insertErr;

      toast.success("Resource uploaded!");

      // Earn XP
      const { earnXp } = await import("@/lib/utils/gamification");
      const xpData = await earnXp(100, "Uploaded Resource");
      if (xpData.success) {
        toast.success(`🎉 +100 XP Earned!`, {
          description: xpData.current_level
            ? `You are now Level ${xpData.current_level}`
            : "Great job uploading a resource!",
        });
      }

      onSuccess(uploadRepoId, data);
      closeUploadDialog();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const availableRepos = repos.filter(
    (r) => r.owner_id === userId || role === "administrator",
  );

  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) closeUploadDialog();
        else onOpenChange(true);
      }}
    >
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Upload Resource</SheetTitle>
          <SheetDescription>
            Upload a file to a repository for learners to access.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-5 py-6">
          <div className="flex flex-col gap-2">
            <Label>
              Repository <span className="text-destructive">*</span>
            </Label>
            {availableRepos.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No repositories available. Create one first.
              </p>
            ) : (
              <Select value={uploadRepoId} onValueChange={setUploadRepoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a repository" />
                </SelectTrigger>
                <SelectContent>
                  {availableRepos.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="up-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="up-title"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              placeholder="e.g., Chapter 1 Notes"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="up-desc">Description</Label>
            <Textarea
              id="up-desc"
              value={uploadDesc}
              onChange={(e) => setUploadDesc(e.target.value)}
              placeholder="Optional description..."
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>
              File <span className="text-destructive">*</span>
            </Label>
            <div
              className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Input
                id="up-file"
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_MIME_TYPES}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
              <div className="flex flex-col items-center gap-2 text-center pointer-events-none">
                <div className="p-3 rounded-full bg-primary/10 mb-2">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                {uploadFile ? (
                  <>
                    <p className="text-sm font-medium text-foreground">
                      {uploadFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatSize(uploadFile.size)}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-foreground">
                      Click to browse or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, Documents, Spreadsheets, Images, Videos (max 50MB)
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="text-xs text-muted-foreground space-y-2">
                <p className="font-medium text-foreground">Upload Guidelines</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>
                    Maximum file size: <strong>50 MB</strong>
                  </li>
                  <li>
                    <strong>Documents:</strong> PDF, DOC, DOCX, TXT, RTF
                  </li>
                  <li>
                    <strong>Spreadsheets:</strong> XLS, XLSX, CSV
                  </li>
                  <li>
                    <strong>Presentations:</strong> PPT, PPTX
                  </li>
                  <li>
                    <strong>Images:</strong> JPG, PNG, WebP, SVG
                  </li>
                  <li>
                    <strong>Videos:</strong> MP4, WebM, MOV
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <SheetFooter className="pt-4 border-t mt-4">
          <Button variant="outline" onClick={closeUploadDialog}>
            Cancel
          </Button>
          <Button
            onClick={handleUploadResource}
            disabled={
              uploading || !uploadFile || !uploadTitle.trim() || !uploadRepoId
            }
            className="w-full sm:w-auto"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Resource
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
