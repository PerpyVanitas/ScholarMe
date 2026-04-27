"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Plus, Trash2, BookOpen, CheckCircle, Users, Lock, FileText } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface StudySet {
  id: string
  title: string
  description: string | null
  type: "flashcard" | "multiple_choice" | "true_false" | "mixed"
  is_public: boolean
  created_at: string
  study_set_items?: { count: number }[]
  profiles?: { full_name: string; avatar_url: string | null }
}

export default function QuizzesPage() {
  const [activeTab, setActiveTab] = useState("my-sets")
  const [myStudySets, setMyStudySets] = useState<StudySet[]>([])
  const [sharedStudySets, setSharedStudySets] = useState<StudySet[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "flashcard" as "flashcard" | "multiple_choice" | "true_false" | "mixed",
    is_public: false,
    content: "",
  })

  useEffect(() => {
    loadStudySets()
  }, [])

  const loadStudySets = async () => {
    try {
      setLoading(true)
      const [myRes, sharedRes] = await Promise.all([
        fetch("/api/quizzes/my-sets"),
        fetch("/api/quizzes/shared")
      ])
      
      if (myRes.ok) {
        const myData = await myRes.json()
        setMyStudySets(myData.data || [])
      }
      
      if (sharedRes.ok) {
        const sharedData = await sharedRes.json()
        setSharedStudySets(sharedData.data || [])
      }
    } catch (error) {
      console.error("Error loading study sets:", error)
      toast.error("Failed to load study sets")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.content) {
      toast.error("Please fill in title and content")
      return
    }

    try {
      setCreating(true)

      // Parse content into items (format: "Q: question A: answer" per line)
      const lines = formData.content.split("\n").filter(line => line.trim())
      const items = lines.map((line) => {
        const match = line.match(/Q:\s*(.+?)\s+A:\s*(.+)/i)
        if (match) {
          return {
            question: match[1].trim(),
            answer: match[2].trim(),
            item_type: formData.type === "mixed" ? "flashcard" : formData.type,
          }
        }
        return null
      }).filter(Boolean)

      if (items.length === 0) {
        toast.error("Please add at least one question in format: Q: question A: answer")
        setCreating(false)
        return
      }

      const res = await fetch("/api/quizzes/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          type: formData.type,
          is_public: formData.is_public,
          source_type: "manual",
          items,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to create study set")
      }

      toast.success("Study set created!")
      setFormData({ title: "", description: "", type: "flashcard", is_public: false, content: "" })
      setDialogOpen(false)
      await loadStudySets()
    } catch (error) {
      console.error("Error creating study set:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create study set")
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteQuiz = async (id: string) => {
    if (!confirm("Are you sure you want to delete this study set?")) return
    
    try {
      const res = await fetch(`/api/quizzes/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      
      toast.success("Study set deleted")
      await loadStudySets()
    } catch (error) {
      console.error("Error deleting study set:", error)
      toast.error("Failed to delete study set")
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "flashcard": return "Flashcards"
      case "multiple_choice": return "Multiple Choice"
      case "true_false": return "True/False"
      case "mixed": return "Mixed"
      default: return type
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Study Quizzes</h1>
          <p className="text-sm text-muted-foreground">Create and study flashcards and quizzes</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Study Set
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="my-sets" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            My Study Sets
          </TabsTrigger>
          <TabsTrigger value="shared" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Shared Sets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-sets">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : myStudySets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
                <BookOpen className="h-12 w-12 text-muted-foreground/50" />
                <p className="text-center text-muted-foreground">No study sets yet. Create your first one!</p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Study Set
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myStudySets.map((set) => (
                <Card key={set.id} className="flex flex-col hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{set.title}</CardTitle>
                        <CardDescription className="line-clamp-2">{set.description || "No description"}</CardDescription>
                      </div>
                      <Badge variant="secondary">{getTypeLabel(set.type)}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {set.study_set_items?.[0]?.count || 0} items
                      </span>
                      <span className="flex items-center gap-1">
                        {set.is_public ? <Users className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                        {set.is_public ? "Public" : "Private"}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-auto">
                      <Button asChild className="flex-1">
                        <Link href={`/dashboard/quizzes/study/${set.id}`}>
                          <BookOpen className="mr-2 h-4 w-4" />
                          Study
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeleteQuiz(set.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="shared">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : sharedStudySets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
                <Users className="h-12 w-12 text-muted-foreground/50" />
                <p className="text-center text-muted-foreground">No shared study sets available yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sharedStudySets.map((set) => (
                <Card key={set.id} className="flex flex-col hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{set.title}</CardTitle>
                        <CardDescription className="line-clamp-2">{set.description || "No description"}</CardDescription>
                      </div>
                      <Badge variant="secondary">{getTypeLabel(set.type)}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {set.study_set_items?.[0]?.count || 0} items
                      </span>
                      <span>by {set.profiles?.full_name || "Unknown"}</span>
                    </div>
                    <Button asChild className="w-full mt-auto">
                      <Link href={`/dashboard/quizzes/study/${set.id}`}>
                        <BookOpen className="mr-2 h-4 w-4" />
                        Study
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Study Set Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Study Set</DialogTitle>
            <DialogDescription>Add flashcards or quiz questions</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateQuiz} className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="e.g., Biology Chapter 3"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                disabled={creating}
              />
            </div>

            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input
                placeholder="What is this study set about?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={creating}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formData.type} onValueChange={(v: any) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger disabled={creating}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flashcard">Flashcards</SelectItem>
                    <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                    <SelectItem value="true_false">True/False</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Visibility</Label>
                <div className="flex items-center gap-2 pt-2">
                  <Switch 
                    checked={formData.is_public} 
                    onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
                    disabled={creating}
                  />
                  <span className="text-sm">{formData.is_public ? "Public" : "Private"}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Questions</Label>
              <p className="text-xs text-muted-foreground">Format: Q: question text A: answer text (one per line)</p>
              <Textarea
                placeholder="Q: What is the capital of France? A: Paris
Q: What is 2+2? A: 4
Q: The sun is a star A: true"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                disabled={creating}
                rows={6}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={creating}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Create Study Set
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
