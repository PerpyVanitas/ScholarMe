"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
} from "lucide-react"
import { toast } from "sonner"
import { getDemoUserFromCookie } from "@/lib/demo"
import type { UserRole } from "@/lib/types"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const MAX_FILE_SIZE = 50 * 1024 * 1024

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
].join(",")

const FILE_TYPES: Record<string, { label: string; icon: typeof FileText; color: string; extensions: string[] }> = {
  pdf: { label: "PDF", icon: FileText, color: "text-red-500 bg-red-500/10", extensions: [".pdf"] },
  document: { label: "Document", icon: FileText, color: "text-blue-500 bg-blue-500/10", extensions: [".doc", ".docx", ".txt", ".rtf"] },
  spreadsheet: { label: "Spreadsheet", icon: FileSpreadsheet, color: "text-green-500 bg-green-500/10", extensions: [".xls", ".xlsx", ".csv"] },
  presentation: { label: "Presentation", icon: Presentation, color: "text-orange-500 bg-orange-500/10", extensions: [".ppt", ".pptx"] },
  image: { label: "Image", icon: FileImage, color: "text-purple-500 bg-purple-500/10", extensions: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"] },
  video: { label: "Video", icon: FileVideo, color: "text-pink-500 bg-pink-500/10", extensions: [".mp4", ".webm", ".mov"] },
  link: { label: "Link", icon: File, color: "text-muted-foreground bg-muted", extensions: [] },
  other: { label: "File", icon: File, color: "text-muted-foreground bg-muted", extensions: [] },
}

function detectFileType(fileName: string): string {
  const ext = "." + fileName.split(".").pop()?.toLowerCase()
  for (const [key, config] of Object.entries(FILE_TYPES)) {
    if (config.extensions.includes(ext)) return key
  }
  return "other"
}

function getTypeInfo(fileType: string) {
  return FILE_TYPES[fileType] || FILE_TYPES.other
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  return (bytes / (1024 * 1024)).toFixed(1) + " MB"
}

interface ResourceRow {
  id: string
  repository_id: string
  title: string
  description: string | null
  url: string
  file_type: string
  uploaded_by: string
  created_at: string
  profiles?: { full_name: string } | null
}

interface RepoRow {
  id: string
  owner_id: string
  title: string
  description: string | null
  access_role: string
  created_at: string
  profiles?: { full_name: string } | null
}

const accessLabels: Record<string, string> = { all: "Everyone", tutor: "Tutors & Admins", admin: "Admins Only" }
const accessBadge: Record<string, string> = {
  all: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  tutor: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  admin: "bg-amber-500/10 text-amber-600 border-amber-500/30",
}

export default function ResourcesPage() {
  const [repos, setRepos] = useState<RepoRow[]>([])
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<UserRole>("learner")
  const [userId, setUserId] = useState("")
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState("all")

  // Expanded repo
  const [expandedRepo, setExpandedRepo] = useState<string | null>(null)
  const [repoResources, setRepoResources] = useState<Record<string, ResourceRow[]>>({})
  const [loadingResources, setLoadingResources] = useState<string | null>(null)

  // New repo dialog
  const [repoDialogOpen, setRepoDialogOpen] = useState(false)
  const [repoTitle, setRepoTitle] = useState("")
  const [repoDesc, setRepoDesc] = useState("")
  const [repoAccess, setRepoAccess] = useState("all")
  const [repoSaving, setRepoSaving] = useState(false)

  // Upload resource dialog
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadRepoId, setUploadRepoId] = useState("")
  const [uploadTitle, setUploadTitle] = useState("")
  const [uploadDesc, setUploadDesc] = useState("")
  const [uploadFile, setUploadFile] = useState<globalThis.File | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canManage = role === "tutor" || role === "administrator"

  const loadRepos = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let uid = user?.id
    let userRole: UserRole = "learner"

    if (uid) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("roles(*)")
        .eq("id", uid)
        .maybeSingle()
      userRole = ((profile?.roles as { name: string } | null)?.name || "learner") as UserRole
    } else {
      const demo = getDemoUserFromCookie("learner")
      userRole = demo.role
      uid = demo.userId
    }

    setUserId(uid || "")
    setRole(userRole)

    const { data } = await supabase
      .from("repositories")
      .select("*, profiles!repositories_owner_id_fkey(full_name)")
      .order("created_at", { ascending: false })
    setRepos(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadRepos() }, [loadRepos])

  async function toggleRepo(repoId: string) {
    if (expandedRepo === repoId) {
      setExpandedRepo(null)
      return
    }
    setLoadingResources(repoId)
    const supabase = createClient()
    const { data } = await supabase
      .from("resources")
      .select("*, profiles!resources_uploaded_by_fkey(full_name)")
      .eq("repository_id", repoId)
      .order("created_at", { ascending: false })
    setRepoResources((prev) => ({ ...prev, [repoId]: data || [] }))
    setExpandedRepo(repoId)
    setLoadingResources(null)
  }

  async function handleCreateRepo() {
    if (!repoTitle.trim()) {
      toast.error("Repository title is required.")
      return
    }
    setRepoSaving(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("repositories")
        .insert({ owner_id: userId, title: repoTitle.trim(), description: repoDesc.trim() || null, access_role: repoAccess })
        .select("*, profiles!repositories_owner_id_fkey(full_name)")
        .single()
      if (error) throw error
      setRepos((prev) => [data, ...prev])
      setRepoDialogOpen(false)
      setRepoTitle("")
      setRepoDesc("")
      setRepoAccess("all")
      toast.success("Repository created!")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create repository")
    } finally {
      setRepoSaving(false)
    }
  }

  async function handleUploadResource() {
    if (!uploadFile || !uploadTitle.trim() || !uploadRepoId) {
      toast.error("Please fill all required fields and select a file.")
      return
    }
    if (uploadFile.size > MAX_FILE_SIZE) {
      toast.error("File exceeds the 50 MB size limit.")
      return
    }
    setUploading(true)
    try {
      const supabase = createClient()
      const ext = uploadFile.name.split(".").pop()?.toLowerCase() || "bin"
      const fileTypeKey = detectFileType(uploadFile.name)
      const filePath = `${userId}/${Date.now()}-${uploadTitle.trim().replace(/\s+/g, "_")}.${ext}`

      const { error: storageErr } = await supabase.storage
        .from("resources")
        .upload(filePath, uploadFile, { upsert: false })
      if (storageErr) throw storageErr

      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/resources/${filePath}`

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
        .single()
      if (insertErr) throw insertErr

      setRepoResources((prev) => ({
        ...prev,
        [uploadRepoId]: [data, ...(prev[uploadRepoId] || [])],
      }))
      toast.success("Resource uploaded!")
      closeUploadDialog()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  async function handleDeleteResource(resource: ResourceRow) {
    try {
      const supabase = createClient()
      const pathMatch = resource.url.split("/resources/")
      if (pathMatch[1]) {
        await supabase.storage.from("resources").remove([decodeURIComponent(pathMatch[1])])
      }
      const { error } = await supabase.from("resources").delete().eq("id", resource.id)
      if (error) throw error
      setRepoResources((prev) => ({
        ...prev,
        [resource.repository_id]: (prev[resource.repository_id] || []).filter((r) => r.id !== resource.id),
      }))
      toast.success("Resource deleted.")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Delete failed")
    }
  }

  function closeUploadDialog() {
    setUploadOpen(false)
    setUploadTitle("")
    setUploadDesc("")
    setUploadRepoId("")
    setUploadFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function openUploadForRepo(repoId: string) {
    setUploadRepoId(repoId)
    setUploadOpen(true)
  }

  const filteredRepos = repos.filter((r) => {
    if (!search) return true
    return (
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase())
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Resources</h1>
          <p className="text-sm text-muted-foreground">
            Browse and download study materials organized in repositories.
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
                  <DialogDescription>Organize resources into a collection. Control who can view the contents.</DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="repo-title">Title <span className="text-destructive">*</span></Label>
                    <Input id="repo-title" value={repoTitle} onChange={(e) => setRepoTitle(e.target.value)} placeholder="e.g., Math 101 Materials" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="repo-desc">Description</Label>
                    <Textarea id="repo-desc" value={repoDesc} onChange={(e) => setRepoDesc(e.target.value)} placeholder="Brief description..." rows={2} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Access</Label>
                    <Select value={repoAccess} onValueChange={setRepoAccess}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Everyone</SelectItem>
                        <SelectItem value="tutor">Tutors & Admins only</SelectItem>
                        <SelectItem value="admin">Admins only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setRepoDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateRepo} disabled={repoSaving}>
                    {repoSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={uploadOpen} onOpenChange={(open) => { if (!open) closeUploadDialog(); else setUploadOpen(true) }}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Resource
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Upload Resource</DialogTitle>
                  <DialogDescription>Upload a file to a repository for learners to access.</DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="up-title">Title <span className="text-destructive">*</span></Label>
                    <Input id="up-title" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="e.g., Chapter 1 Notes" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="up-desc">Description</Label>
                    <Textarea id="up-desc" value={uploadDesc} onChange={(e) => setUploadDesc(e.target.value)} placeholder="Optional description..." rows={2} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Repository <span className="text-destructive">*</span></Label>
                    {repos.filter((r) => r.owner_id === userId || role === "administrator").length === 0 ? (
                      <p className="text-sm text-muted-foreground">No repositories available. Create one first.</p>
                    ) : (
                      <Select value={uploadRepoId} onValueChange={setUploadRepoId}>
                        <SelectTrigger><SelectValue placeholder="Select a repository" /></SelectTrigger>
                        <SelectContent>
                          {repos
                            .filter((r) => r.owner_id === userId || role === "administrator")
                            .map((r) => <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="up-file">File <span className="text-destructive">*</span></Label>
                    <Input
                      id="up-file"
                      ref={fileInputRef}
                      type="file"
                      accept={ACCEPTED_MIME_TYPES}
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    />
                    {uploadFile && (
                      <p className="text-xs text-muted-foreground">{uploadFile.name} ({formatSize(uploadFile.size)})</p>
                    )}
                  </div>

                  {/* Upload guidelines */}
                  <div className="rounded-md border border-border bg-muted/50 p-3">
                    <div className="flex items-start gap-2">
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p className="font-medium text-foreground">Upload Guidelines</p>
                        <ul className="list-disc pl-4 space-y-0.5">
                          <li>Maximum file size: <strong>50 MB</strong></li>
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
                            <strong>Images:</strong> JPG, PNG, GIF, WebP, SVG
                          </li>
                          <li>
                            <strong>Videos:</strong> MP4, WebM, MOV
                          </li>
                          <li>Only <strong>tutors</strong> and <strong>administrators</strong> can upload</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={closeUploadDialog}>Cancel</Button>
                  <Button onClick={handleUploadResource} disabled={uploading || !uploadFile || !uploadTitle.trim() || !uploadRepoId}>
                    {uploading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</>
                    ) : (
                      <><Upload className="mr-2 h-4 w-4" />Upload</>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search repositories..." className="pl-9" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="All Types" /></SelectTrigger>
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
            <h3 className="text-lg font-semibold text-foreground">No repositories found</h3>
            <p className="text-sm text-muted-foreground">
              {search ? "Try adjusting your search." : canManage ? "Create a repository and start uploading resources." : "Check back later for learning materials."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredRepos.map((repo) => {
            const isExpanded = expandedRepo === repo.id
            const isLoading = loadingResources === repo.id
            const items = repoResources[repo.id] || []
            const isOwner = repo.owner_id === userId
            const canAdd = isOwner || role === "administrator"
            const filtered = filterType === "all" ? items : items.filter((r) => r.file_type === filterType)

            return (
              <Card key={repo.id}>
                <CardHeader className="cursor-pointer select-none p-4" onClick={() => toggleRepo(repo.id)}>
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <FolderOpen className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-semibold truncate">{repo.title}</CardTitle>
                        <Badge variant="outline" className={`text-[10px] shrink-0 ${accessBadge[repo.access_role] || ""}`}>
                          {accessLabels[repo.access_role] || repo.access_role}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs mt-0.5 truncate">
                        {repo.description || "No description"} · by {(repo.profiles as { full_name: string } | null)?.full_name || "Unknown"}
                      </CardDescription>
                    </div>
                    {canAdd && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="shrink-0"
                        onClick={(e) => { e.stopPropagation(); openUploadForRepo(repo.id) }}
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
                          {filterType !== "all" ? "No matching resources for this filter." : "No resources in this repository yet."}
                        </p>
                        {canAdd && filterType === "all" && (
                          <Button size="sm" variant="outline" className="mt-3" onClick={() => openUploadForRepo(repo.id)}>
                            <Upload className="mr-2 h-3.5 w-3.5" />
                            Upload First Resource
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {filtered.map((resource) => {
                          const info = getTypeInfo(resource.file_type)
                          const Icon = info.icon
                          const canDelete = role === "administrator" || resource.uploaded_by === userId || isOwner

                          return (
                            <div key={resource.id} className="flex items-center gap-3 rounded-lg border border-border/60 p-3 transition-colors hover:bg-muted/30">
                              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${info.color}`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-foreground truncate">{resource.title}</span>
                                  <Badge variant="secondary" className="text-[10px] shrink-0">{info.label}</Badge>
                                </div>
                                {resource.description && (
                                  <p className="text-xs text-muted-foreground truncate mt-0.5">{resource.description}</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {(resource.profiles as { full_name: string } | null)?.full_name || "Unknown"} · {new Date(resource.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                  <a href={resource.url} target="_blank" rel="noopener noreferrer" aria-label={`Download ${resource.title}`}>
                                    <Download className="h-4 w-4" />
                                  </a>
                                </Button>
                                {canDelete && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => handleDeleteResource(resource)}
                                    aria-label={`Delete ${resource.title}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
