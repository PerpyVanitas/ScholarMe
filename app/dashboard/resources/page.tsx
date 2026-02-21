"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  FolderOpen,
  Plus,
  ExternalLink,
  FileText,
  Loader2,
  BookOpen,
  Link as LinkIcon,
} from "lucide-react";
import { toast } from "sonner";
import type { Repository, Resource, UserRole } from "@/lib/types";

const accessLabels: Record<string, string> = {
  all: "Everyone",
  tutor: "Tutors Only",
  admin: "Admins Only",
};

const accessColors: Record<string, string> = {
  all: "bg-success/10 text-success border-success/30",
  tutor: "bg-primary/10 text-primary border-primary/30",
  admin: "bg-warning/10 text-warning-foreground border-warning/30",
};

export default function ResourcesPage() {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole>("learner");
  const [userId, setUserId] = useState("");

  // New repo dialog
  const [repoOpen, setRepoOpen] = useState(false);
  const [repoTitle, setRepoTitle] = useState("");
  const [repoDesc, setRepoDesc] = useState("");
  const [repoAccess, setRepoAccess] = useState("all");
  const [repoLoading, setRepoLoading] = useState(false);

  // Expanded repo with resources
  const [expandedRepo, setExpandedRepo] = useState<string | null>(null);
  const [resources, setResources] = useState<Record<string, Resource[]>>({});

  // New resource
  const [resourceOpen, setResourceOpen] = useState(false);
  const [resourceRepoId, setResourceRepoId] = useState("");
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceDesc, setResourceDesc] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [resourceType, setResourceType] = useState("");
  const [resourceLoading, setResourceLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("*, roles(*)")
        .eq("id", user.id)
        .single();

      setRole((profile?.roles?.name || "learner") as UserRole);

      const { data } = await supabase
        .from("repositories")
        .select("*, profiles(full_name)")
        .order("created_at", { ascending: false });

      setRepos(data || []);
      setLoading(false);
    }
    load();
  }, []);

  async function loadResources(repoId: string) {
    if (expandedRepo === repoId) {
      setExpandedRepo(null);
      return;
    }
    const supabase = createClient();
    const { data } = await supabase
      .from("resources")
      .select("*, profiles(full_name)")
      .eq("repository_id", repoId)
      .order("created_at", { ascending: false });
    setResources((prev) => ({ ...prev, [repoId]: data || [] }));
    setExpandedRepo(repoId);
  }

  async function createRepo() {
    if (!repoTitle.trim()) return;
    setRepoLoading(true);

    const res = await fetch("/api/repositories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: repoTitle,
        description: repoDesc,
        access_role: repoAccess,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setRepos((prev) => [data, ...prev]);
      setRepoOpen(false);
      setRepoTitle("");
      setRepoDesc("");
      setRepoAccess("all");
      toast.success("Repository created");
    } else {
      toast.error("Failed to create repository");
    }
    setRepoLoading(false);
  }

  async function addResource() {
    if (!resourceTitle.trim() || !resourceUrl.trim()) return;
    setResourceLoading(true);

    const res = await fetch(`/api/repositories/${resourceRepoId}/resources`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: resourceTitle,
        description: resourceDesc,
        url: resourceUrl,
        file_type: resourceType || null,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setResources((prev) => ({
        ...prev,
        [resourceRepoId]: [data, ...(prev[resourceRepoId] || [])],
      }));
      setResourceOpen(false);
      setResourceTitle("");
      setResourceDesc("");
      setResourceUrl("");
      setResourceType("");
      toast.success("Resource added");
    } else {
      toast.error("Failed to add resource");
    }
    setResourceLoading(false);
  }

  const canCreate = role === "tutor" || role === "administrator";

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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Resources</h1>
          <p className="text-muted-foreground">Study materials and learning resources.</p>
        </div>
        {canCreate && (
          <Dialog open={repoOpen} onOpenChange={setRepoOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Repository
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Repository</DialogTitle>
                <DialogDescription>
                  Create a new resource repository to organize study materials.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-4">
                <div className="flex flex-col gap-2">
                  <Label>Title</Label>
                  <Input
                    value={repoTitle}
                    onChange={(e) => setRepoTitle(e.target.value)}
                    placeholder="e.g., Algebra Study Guides"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Description (optional)</Label>
                  <Textarea
                    value={repoDesc}
                    onChange={(e) => setRepoDesc(e.target.value)}
                    placeholder="What kind of resources are in this repository?"
                    rows={2}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Access</Label>
                  <Select value={repoAccess} onValueChange={setRepoAccess}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Everyone</SelectItem>
                      <SelectItem value="tutor">Tutors Only</SelectItem>
                      <SelectItem value="admin">Admins Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRepoOpen(false)}>Cancel</Button>
                <Button onClick={createRepo} disabled={repoLoading}>
                  {repoLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {repos.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <div className="rounded-full bg-muted p-4">
              <BookOpen className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No repositories available</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {repos.map((repo) => {
            const isExpanded = expandedRepo === repo.id;
            const repoResources = resources[repo.id] || [];
            const isOwner = repo.owner_id === userId;
            const canAddResource = isOwner || role === "administrator";

            return (
              <Card key={repo.id} className="border-border/60">
                <CardHeader
                  className="cursor-pointer"
                  onClick={() => loadResources(repo.id)}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <FolderOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-base truncate">{repo.title}</CardTitle>
                        {repo.description && (
                          <CardDescription className="mt-0.5 truncate">{repo.description}</CardDescription>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className={`shrink-0 w-fit ${accessColors[repo.access_role]}`}>
                      {accessLabels[repo.access_role]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 ml-13">
                    <span>By {repo.profiles?.full_name || "Unknown"}</span>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="border-t border-border/60 pt-4">
                    {canAddResource && (
                      <div className="mb-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setResourceRepoId(repo.id);
                            setResourceOpen(true);
                          }}
                        >
                          <Plus className="mr-2 h-3.5 w-3.5" />
                          Add Resource
                        </Button>
                      </div>
                    )}
                    {repoResources.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        No resources in this repository yet.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {repoResources.map((resource) => (
                          <div
                            key={resource.id}
                            className="flex items-start gap-3 rounded-lg border border-border/60 p-3"
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex min-w-0 flex-1 flex-col">
                              <span className="text-sm font-medium text-foreground truncate">
                                {resource.title}
                              </span>
                              {resource.description && (
                                <span className="text-xs text-muted-foreground truncate">
                                  {resource.description}
                                </span>
                              )}
                            </div>
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 text-primary hover:text-primary/80"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={resourceOpen} onOpenChange={setResourceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Resource</DialogTitle>
            <DialogDescription>Add a link to a study resource.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label>Title</Label>
              <Input
                value={resourceTitle}
                onChange={(e) => setResourceTitle(e.target.value)}
                placeholder="e.g., Quadratic Equations Guide"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>URL</Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={resourceUrl}
                  onChange={(e) => setResourceUrl(e.target.value)}
                  placeholder="https://..."
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Description (optional)</Label>
              <Input
                value={resourceDesc}
                onChange={(e) => setResourceDesc(e.target.value)}
                placeholder="Brief description"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>File Type (optional)</Label>
              <Select value={resourceType} onValueChange={setResourceType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="doc">Document</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="link">Web Link</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResourceOpen(false)}>Cancel</Button>
            <Button onClick={addResource} disabled={resourceLoading}>
              {resourceLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Add Resource
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
