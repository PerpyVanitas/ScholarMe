"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LibraryCatalog } from "@/features/library/components/library-catalog";
import { getLibraryCatalog } from "@/features/library/api/actions";
import {
  FolderOpen,
  Plus,
  Loader2,
  BookOpen,
  Download,
  Trash2,
  Search,
  ChevronDown,
  ChevronRight,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import type { UserRole } from "@/lib/types";
import { getRoleName } from "@/lib/utils/roles";
import { ensureTutor } from "@/app/dashboard/profile/actions";
import { RepoRow, ResourceRow, getTypeInfo } from "./types";
import dynamic from "next/dynamic";

const RepoCreateDialog = dynamic(
  () =>
    import("./components/repo-create-dialog").then(
      (mod) => mod.RepoCreateDialog,
    ),
  { ssr: false },
);
const ResourceUploadSheet = dynamic(
  () =>
    import("./components/resource-upload-sheet").then(
      (mod) => mod.ResourceUploadSheet,
    ),
  { ssr: false },
);
const ResourcePreviewDialog = dynamic(
  () =>
    import("./components/resource-preview-dialog").then(
      (mod) => mod.ResourcePreviewDialog,
    ),
  { ssr: false },
);

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
  const [physicalResources, setPhysicalResources] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("digital");

  const [expandedRepo, setExpandedRepo] = useState<string | null>(null);
  const [repoResources, setRepoResources] = useState<
    Record<string, ResourceRow[]>
  >({});
  const [loadingResources, setLoadingResources] = useState<string | null>(null);

  const [repoDialogOpen, setRepoDialogOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadRepoId, setUploadRepoId] = useState("");

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewResource, setPreviewResource] = useState<ResourceRow | null>(
    null,
  );

  const canManage =
    role === "tutor" || role === "administrator" || role === "super_admin";

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
      .select(
        "id, owner_id, title, description, access_role, created_at, profiles!repositories_owner_id_fkey(full_name)",
      )
      .order("created_at", { ascending: false });

    // Client-side filter by access_role based on the viewer's role
    const allRepos = data || [];
    const visibleRepos = allRepos.filter((repo) => {
      if (repo.access_role === "all") return true;
      if (repo.access_role === "tutor") {
        return (
          userRole === "tutor" ||
          userRole === "administrator" ||
          userRole === "super_admin"
        );
      }
      if (repo.access_role === "admin") {
        return userRole === "administrator" || userRole === "super_admin";
      }
      return false;
    });
    setRepos(visibleRepos);
    
    // Fetch physical resources for the LibraryCatalog
    try {
      const pResources = await getLibraryCatalog();
      setPhysicalResources(pResources);
    } catch (e) {
      console.error("Failed to load physical resources", e);
    }

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
      .select(
        "id, repository_id, title, description, url, file_type, is_public, uploaded_by, created_at, profiles!resources_uploaded_by_fkey(full_name)",
      )
      .eq("repository_id", repoId)
      .order("created_at", { ascending: false });
    setRepoResources((prev) => ({ ...prev, [repoId]: data || [] }));
    setExpandedRepo(repoId);
    setLoadingResources(null);
  }

  async function handleDeleteResource(resource: ResourceRow) {
    // Optimistic UI update
    setRepoResources((prev) => ({
      ...prev,
      [resource.repository_id]: (prev[resource.repository_id] || []).filter(
        (r) => r.id !== resource.id,
      ),
    }));

    const timeoutId = setTimeout(async () => {
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
      } catch (err: unknown) {
        console.error("Delete failed in background:", err);
        toast.error(err instanceof Error ? err.message : "An error occurred");
        // Rollback on failure
        setRepoResources((prev) => ({
          ...prev,
          [resource.repository_id]: [
            ...(prev[resource.repository_id] || []),
            resource,
          ],
        }));
      }
    }, 5000);

    toast.success("Resource deleted", {
      action: {
        label: "Undo",
        onClick: () => {
          clearTimeout(timeoutId);
          // Revert optimistic delete
          setRepoResources((prev) => ({
            ...prev,
            [resource.repository_id]: [
              ...(prev[resource.repository_id] || []),
              resource,
            ],
          }));
          toast.success("Resource restored");
        },
      },
    });
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRepoDialogOpen(true)}
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              New Repository
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setUploadRepoId("");
                setUploadOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Upload Resource
            </Button>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="digital">Digital Repositories</TabsTrigger>
          <TabsTrigger value="physical">Physical Library</TabsTrigger>
        </TabsList>

        <TabsContent value="digital" className="mt-0 flex flex-col gap-6">
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
            const canAdd =
              isOwner || role === "administrator" || role === "super_admin";
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
                            <Plus className="mr-2 h-3.5 w-3.5" />
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
                            role === "super_admin" ||
                            resource.uploaded_by === userId ||
                            isOwner;
                          // A resource is considered private if is_public is explicitly false
                          const isPrivate = resource.is_public === false;
                          // Users who can bypass the private lock
                          const canViewPrivate = canDelete || role === "tutor";

                          return (
                            <div
                              key={resource.id}
                              className={`flex items-center gap-3 rounded-lg border border-border/60 p-3 transition-colors ${isPrivate && !canViewPrivate ? "opacity-60 cursor-not-allowed" : "hover:bg-muted/30 cursor-pointer"}`}
                              onClick={() => {
                                if (isPrivate && !canViewPrivate) return;
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
                                  <span className="text-sm font-medium text-foreground break-words overflow-hidden max-w-full min-w-0">
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
                                {isPrivate && !canViewPrivate ? (
                                  <span className="flex items-center gap-1 text-xs text-muted-foreground px-2">
                                    <Lock className="h-3.5 w-3.5" />
                                    Private
                                  </span>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    asChild
                                  >
                                    <a
                                      href={`${resource.url}?download=`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      aria-label={`Download ${resource.title}`}
                                    >
                                      <Download className="h-4 w-4" />
                                    </a>
                                  </Button>
                                )}
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
      </TabsContent>

      <TabsContent value="physical" className="mt-0">
        <LibraryCatalog initialResources={physicalResources} />
      </TabsContent>
      </Tabs>

      {canManage && (
        <RepoCreateDialog
          open={repoDialogOpen}
          onOpenChange={setRepoDialogOpen}
          userId={userId}
          onSuccess={(newRepo) => {
            setRepos((prev) => [newRepo, ...prev]);
            setRepoDialogOpen(false);
          }}
        />
      )}

      {canManage && (
        <ResourceUploadSheet
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          userId={userId}
          role={role}
          repos={repos}
          initialRepoId={uploadRepoId}
          onSuccess={(repoId, newResource) => {
            setRepoResources((prev) => ({
              ...prev,
              [repoId]: [newResource, ...(prev[repoId] || [])],
            }));
          }}
        />
      )}

      <ResourcePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        resource={previewResource}
      />
    </div>
  );
}
