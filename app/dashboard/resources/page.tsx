"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  FolderOpen,
  Plus,
  FileText,
  FileImage,
  FileVideo,
  FileSpreadsheet,
  File,
  Presentation,
  Loader2,
  BookOpen,
  Download,
  Trash2,
  Upload,
  Info,
  Search,
  ChevronDown,
  ChevronRight,
  Eye,
  X,
} from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { toast } from "sonner";
import type { UserRole } from "@/lib/types";
import { getRoleName } from "@/lib/utils/roles";
import { ensureTutor } from "@/app/dashboard/profile/actions";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const MAX_FILE_SIZE = 50 * 1024 * 1024;

const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "video/mp4",
  "video/webm",
  "video/quicktime",
].join(",");

const FILE_TYPES: Record<
  string,
  { label: string; icon: typeof FileText; color: string; extensions: string[] }
> = {
  pdf: {
    label: "PDF",
    icon: FileText,
    color: "text-amber-500 bg-amber-500/10",
    extensions: [".pdf"],
  },
  document: {
    label: "Document",
    icon: FileText,
    color: "text-slate-400 bg-slate-400/10",
    extensions: [".doc", ".docx", ".txt", ".rtf"],
  },
  spreadsheet: {
    label: "Spreadsheet",
    icon: FileSpreadsheet,
    color: "text-green-500 bg-green-500/10",
    extensions: [".xls", ".xlsx", ".csv"],
  },
  presentation: {
    label: "Presentation",
    icon: Presentation,
    color: "text-orange-500 bg-orange-500/10",
    extensions: [".ppt", ".pptx"],
  },
  image: {
    label: "Image",
    icon: FileImage,
    color: "text-purple-500 bg-purple-500/10",
    extensions: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
  },
  video: {
    label: "Video",
    icon: FileVideo,
    color: "text-pink-500 bg-pink-500/10",
    extensions: [".mp4", ".webm", ".mov"],
  },
  link: {
    label: "Link",
    icon: File,
    color: "text-muted-foreground bg-muted",
    extensions: [],
  },
  other: {
    label: "File",
    icon: File,
    color: "text-muted-foreground bg-muted",
    extensions: [],
  },
};

function detectFileType(fileName: string): string {
  const ext = "." + fileName.split(".").pop()?.toLowerCase();
  for (const [key, config] of Object.entries(FILE_TYPES)) {
    if (config.extensions.includes(ext)) return key;
  }
  return "other";
}

function getTypeInfo(fileType: string) {
  return FILE_TYPES[fileType] || FILE_TYPES.other;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

interface ResourceRow {
  id: string;
  repository_id: string;
  title: string;
  description: string | null;
  url: string;
  file_type: string;
  uploaded_by: string;
  created_at: string;
  profiles?: { full_name: string } | null;
}

interface RepoRow {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  access_role: string;
  created_at: string;
  profiles?: { full_name: string } | null;
}

const accessLabels: Record<string, string> = {
  all: "Everyone",
  tutor: "Tutors & Admins",
  admin: "Admins Only",
};
const accessBadge: Record<string, string> = {
  all: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  tutor: "bg-primary/10 text-primary border-primary/30",
  admin: "bg-amber-500/10 text-amber-600 border-amber-500/30",
};

export default function ResourcesPage() {
  const [repos, setRepos] = useState<RepoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole>("learner");
  const [userId, setUserId] = useState("");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  // Expanded repo
  const [expandedRepo, setExpandedRepo] = useState<string | null>(null);
  const [repoResources, setRepoResources] = useState<
    Record<string, ResourceRow[]>
  >({});
  const [loadingResources, setLoadingResources] = useState<string | null>(null);

  // New repo dialog
  const [repoDialogOpen, setRepoDialogOpen] = useState(false);
  const [repoTitle, setRepoTitle] = useState("");
  const [repoDesc, setRepoDesc] = useState("");
  const [repoAccess, setRepoAccess] = useState("all");
  const [repoSaving, setRepoSaving] = useState(false);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadRepoId, setUploadRepoId] = useState("");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadFile, setUploadFile] = useState<globalThis.File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview dialog states
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewResource, setPreviewResource] = useState<ResourceRow | null>(
    null,
  );

  const canManage = role === "tutor" || role === "administrator";

  const loadRepos = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const uid = user?.id;
    let userRole: UserRole = "learner";

    if (uid) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("roles(name)")
        .eq("id", uid)
        .maybeSingle();
      if (profile) {
        userRole = getRoleName(
          profile as Parameters<typeof getRoleName>[0],
        ) as UserRole;
      }
      if (userRole === "tutor") {
        await ensureTutor();
      }
    }

    setUserId(uid || "");
    setRole(userRole);

    const { data } = await supabase
      .from("repositories")
      .select("*, profiles!repositories_owner_id_fkey(full_name)")
      .order("created_at", { ascending: false });
    setRepos(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRepos();
  }, [loadRepos]);

  async function toggleRepo(repoId: string) {
    if (expandedRepo === repoId) {
      setExpandedRepo(null);
      return;
    }
    setLoadingResources(repoId);
    const supabase = createClient();
    const { data } = await supabase
      .from("resources")
      .select("*, profiles!resources_uploaded_by_fkey(full_name)")
      .eq("repository_id", repoId)
      .order("created_at", { ascending: false });
    setRepoResources((prev) => ({ ...prev, [repoId]: data || [] }));
    setExpandedRepo(repoId);
    setLoadingResources(null);
  }

  async function handleCreateRepo() {
    if (!repoTitle.trim()) {
      toast.error("Repository title is required.");
      return;
    }
    setRepoSaving(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("repositories")
        .insert({
          owner_id: userId,
          title: repoTitle.trim(),
          description: repoDesc.trim() || null,
          access_role: repoAccess,
        })
        .select("*, profiles!repositories_owner_id_fkey(full_name)")
        .single();
      if (error) throw error;
      setRepos((prev) => [data, ...prev]);
      setRepoDialogOpen(false);
      setRepoTitle("");
      setRepoDesc("");
      setRepoAccess("all");
      toast.success("Repository created!");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create repository",
      );
    } finally {
      setRepoSaving(false);
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
        .select("*, profiles!resources_uploaded_by_fkey(full_name)")
        .single();
      if (insertErr) throw insertErr;

      setRepoResources((prev) => ({
        ...prev,
        [uploadRepoId]: [data, ...(prev[uploadRepoId] || [])],
      }));

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

      closeUploadDialog();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteResource(resource: ResourceRow) {
    try {
      const supabase = createClient();
      const pathMatch = resource.url.split("/resources/");
      if (pathMatch[1]) {
        await supabase.storage
          .from("resources")
          .remove([decodeURIComponent(pathMatch[1])]);
      }
      const { error } = await supabase
        .from("resources")
        .delete()
        .eq("id", resource.id);
      if (error) throw error;
      setRepoResources((prev) => ({
        ...prev,
        [resource.repository_id]: (prev[resource.repository_id] || []).filter(
          (r) => r.id !== resource.id,
        ),
      }));
      toast.success("Resource deleted.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  function closeUploadDialog() {
    setUploadOpen(false);
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

  function openUploadForRepo(repoId: string) {
    setUploadRepoId(repoId);
    setUploadOpen(true);
  }

  const filteredRepos = repos.filter((r) => {
    if (!search) return true;
    return (
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase())
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Resources
          </h1>
          <p className="text-sm text-muted-foreground">
            {canManage
              ? "Create repositories, upload files, and share with learners or other tutors."
              : "Browse and download study materials organized in repositories."}
          </p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Dialog open={repoDialogOpen} onOpenChange={setRepoDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <FolderOpen className="mr-2 h-4 w-4" />
                  New Repository
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Repository</DialogTitle>
                  <DialogDescription>
                    Organize resources into a collection. Control who can view
                    the contents.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="repo-title">
                      Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="repo-title"
                      value={repoTitle}
                      onChange={(e) => setRepoTitle(e.target.value)}
                      placeholder="e.g., Math 101 Materials"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="repo-desc">Description</Label>
                    <Textarea
                      id="repo-desc"
                      value={repoDesc}
                      onChange={(e) => setRepoDesc(e.target.value)}
                      placeholder="Brief description..."
                      rows={2}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Access</Label>
                    <Select value={repoAccess} onValueChange={setRepoAccess}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Everyone</SelectItem>
                        <SelectItem value="tutor">
                          Tutors & Admins only
                        </SelectItem>
                        <SelectItem value="admin">Admins only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setRepoDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateRepo} disabled={repoSaving}>
                    {repoSaving && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Sheet
              open={uploadOpen}
              onOpenChange={(open) => {
                if (!open) closeUploadDialog();
                else setUploadOpen(true);
              }}
            >
              <SheetTrigger asChild>
                <Button size="sm">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Resource
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-full sm:max-w-md overflow-y-auto"
              >
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
                    {repos.filter(
                      (r) => r.owner_id === userId || role === "administrator",
                    ).length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No repositories available. Create one first.
                      </p>
                    ) : (
                      <Select
                        value={uploadRepoId}
                        onValueChange={setUploadRepoId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a repository" />
                        </SelectTrigger>
                        <SelectContent>
                          {repos
                            .filter(
                              (r) =>
                                r.owner_id === userId ||
                                role === "administrator",
                            )
                            .map((r) => (
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
                        onChange={(e) =>
                          setUploadFile(e.target.files?.[0] || null)
                        }
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
                              PDF, Documents, Spreadsheets, Images, Videos (max
                              50MB)
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Upload guidelines */}
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <div className="flex items-start gap-3">
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="text-xs text-muted-foreground space-y-2">
                        <p className="font-medium text-foreground">
                          Upload Guidelines
                        </p>
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
                      uploading ||
                      !uploadFile ||
                      !uploadTitle.trim() ||
                      !uploadRepoId
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
          </div>
        )}
      </div>

      {/* Search */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search repositories..."
            className="pl-9"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="pdf">PDF</SelectItem>
            <SelectItem value="document">Documents</SelectItem>
            <SelectItem value="spreadsheet">Spreadsheets</SelectItem>
            <SelectItem value="presentation">Presentations</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Repository List */}
      {filteredRepos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16">
            <div className="rounded-full bg-muted p-4">
              <BookOpen className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              No repositories found
            </h3>
            <p className="text-sm text-muted-foreground">
              {search
                ? "Try adjusting your search."
                : canManage
                  ? "Create a repository and start uploading resources."
                  : "Check back later for learning materials."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredRepos.map((repo) => {
            const isExpanded = expandedRepo === repo.id;
            const isLoading = loadingResources === repo.id;
            const items = repoResources[repo.id] || [];
            const isOwner = repo.owner_id === userId;
            const canAdd = isOwner || role === "administrator";
            const filtered =
              filterType === "all"
                ? items
                : items.filter((r) => r.file_type === filterType);

            return (
              <Card key={repo.id}>
                <CardHeader
                  className="cursor-pointer select-none p-4"
                  onClick={() => toggleRepo(repo.id)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <FolderOpen className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-semibold truncate">
                          {repo.title}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className={`text-[10px] shrink-0 ${accessBadge[repo.access_role] || ""}`}
                        >
                          {accessLabels[repo.access_role] || repo.access_role}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs mt-0.5 truncate">
                        {repo.description || "No description"} · by{" "}
                        {(repo.profiles as { full_name: string } | null)
                          ?.full_name || "Unknown"}
                      </CardDescription>
                    </div>
                    {canAdd && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          openUploadForRepo(repo.id);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                        <span className="sr-only">Add resource</span>
                      </Button>
                    )}
                  </div>
                </CardHeader>
                {isExpanded && (
                  <CardContent className="border-t border-border/60 px-4 pt-3 pb-4">
                    {isLoading ? (
                      <div className="flex justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : filtered.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-sm text-muted-foreground">
                          {filterType !== "all"
                            ? "No matching resources for this filter."
                            : "No resources in this repository yet."}
                        </p>
                        {canAdd && filterType === "all" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-3"
                            onClick={() => openUploadForRepo(repo.id)}
                          >
                            <Upload className="mr-2 h-3.5 w-3.5" />
                            Upload First Resource
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {filtered.map((resource) => {
                          const info = getTypeInfo(resource.file_type);
                          const Icon = info.icon;
                          const canDelete =
                            role === "administrator" ||
                            resource.uploaded_by === userId ||
                            isOwner;

                          return (
                            <div
                              key={resource.id}
                              className="flex items-center gap-3 rounded-lg border border-border/60 p-3 transition-colors hover:bg-muted/30 cursor-pointer"
                              onClick={() => {
                                setPreviewResource(resource);
                                setPreviewOpen(true);
                              }}
                            >
                              <div
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${info.color}`}
                              >
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-foreground truncate">
                                    {resource.title}
                                  </span>
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] shrink-0"
                                  >
                                    {info.label}
                                  </Badge>
                                </div>
                                {resource.description && (
                                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                                    {resource.description}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {(
                                    resource.profiles as {
                                      full_name: string;
                                    } | null
                                  )?.full_name || "Unknown"}{" "}
                                  ·{" "}
                                  {new Date(
                                    resource.created_at,
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                              <div
                                className="flex items-center gap-1 shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  asChild
                                >
                                  <a
                                    href={resource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={`Download ${resource.title}`}
                                  >
                                    <Download className="h-4 w-4" />
                                  </a>
                                </Button>
                                {canDelete && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() =>
                                      handleDeleteResource(resource)
                                    }
                                    aria-label={`Delete ${resource.title}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Resource Preview Dialog */}
      <DialogPrimitive.Root open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-black/98 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content className="fixed inset-0 z-[100] flex flex-col text-white duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 outline-none">
            <DialogPrimitive.Title className="sr-only">
              Resource Preview
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">
              Preview of the selected resource
            </DialogPrimitive.Description>
            {/* Top Bar */}
            <div className="h-16 border-b border-zinc-800 bg-zinc-950 px-4 md:px-6 flex items-center justify-between shrink-0 select-none">
              {/* Left side: Icon, title, uploader */}
              <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
                {previewResource && (
                  <>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800">
                      {(() => {
                        const info = getTypeInfo(previewResource.file_type);
                        const Icon = info.icon;
                        return (
                          <Icon
                            className={`h-5 w-5 ${info.color.split(" ")[0]}`}
                          />
                        );
                      })()}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-sm font-semibold text-zinc-100 truncate">
                        {previewResource.title}
                      </h2>
                      <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                        Uploaded by{" "}
                        {(
                          previewResource.profiles as {
                            full_name: string;
                          } | null
                        )?.full_name || "Unknown"}{" "}
                        on{" "}
                        {new Date(
                          previewResource.created_at,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Right side: Actions & Close */}
              <div className="flex items-center gap-2 shrink-0">
                {previewResource && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 text-zinc-300 hover:bg-zinc-900 hover:text-white"
                    asChild
                  >
                    <a
                      href={previewResource.url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4 text-amber-500" />
                      <span className="hidden sm:inline">Download</span>
                    </a>
                  </Button>
                )}

                <div className="w-px h-6 bg-zinc-800 mx-1 hidden sm:block"></div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-white"
                  onClick={() => setPreviewOpen(false)}
                >
                  <X className="h-5 w-5" />
                  <span className="sr-only">Close</span>
                </Button>
              </div>
            </div>

            {/* Viewer Container */}
            <div className="flex-1 w-full p-4 md:p-8 flex items-center justify-center overflow-hidden">
              {previewResource && renderPreviewContent(previewResource)}
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}

function renderPreviewContent(resource: ResourceRow) {
  const url = resource.url;
  const ext = "." + url.split(".").pop()?.toLowerCase().split("?")[0];

  if (resource.file_type === "image") {
    return (
      <div className="flex items-center justify-center w-full h-full max-h-[85vh] bg-zinc-950/20 overflow-auto rounded-lg border border-zinc-800/50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={resource.title}
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
        />
      </div>
    );
  }

  if (resource.file_type === "video") {
    return (
      <div className="flex items-center justify-center w-full h-full max-h-[85vh] bg-black rounded-lg overflow-hidden border border-zinc-800/50">
        <video
          src={url}
          controls
          className="w-full h-full max-h-[85vh] object-contain shadow-2xl"
        />
      </div>
    );
  }

  // Office documents
  const officeExtensions = [".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx"];
  if (
    officeExtensions.includes(ext) ||
    resource.file_type === "presentation" ||
    (resource.file_type === "spreadsheet" && ext !== ".csv")
  ) {
    const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
    return (
      <iframe
        src={officeViewerUrl}
        className="w-full h-full min-h-[75vh] md:min-h-[85vh] max-w-5xl mx-auto border border-zinc-800 rounded-lg bg-zinc-950 shadow-2xl"
        title={resource.title}
        frameBorder="0"
      />
    );
  }

  // PDF
  if (resource.file_type === "pdf" || ext === ".pdf") {
    return (
      <iframe
        src={`${url}#toolbar=1&navpanes=0&view=Fit`}
        className="w-full h-full min-h-[75vh] md:min-h-[85vh] max-w-5xl mx-auto border border-zinc-800 rounded-lg bg-zinc-950 shadow-2xl"
        title={resource.title}
        frameBorder="0"
      />
    );
  }

  // Plain text or CSV
  if (ext === ".txt" || ext === ".csv" || ext === ".rtf") {
    const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
    return (
      <iframe
        src={googleViewerUrl}
        className="w-full h-full min-h-[75vh] md:min-h-[85vh] max-w-5xl mx-auto border border-zinc-800 rounded-lg bg-zinc-950 shadow-2xl"
        title={resource.title}
        frameBorder="0"
      />
    );
  }

  // Fallback for other file types
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed border-zinc-800/80 rounded-lg h-[50vh] max-w-lg bg-zinc-900/40">
      <File className="h-12 w-12 text-zinc-500 mb-4" />
      <h3 className="text-sm font-semibold text-zinc-300 mb-2">
        No preview available for this file type
      </h3>
      <p className="text-xs text-zinc-500 mb-6 max-w-xs leading-relaxed">
        This file format ({ext}) cannot be previewed in the browser. You can
        download it directly to view its contents.
      </p>
      <Button
        asChild
        size="sm"
        className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-semibold"
      >
        <a
          href={url}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download File
        </a>
      </Button>
    </div>
  );
}
