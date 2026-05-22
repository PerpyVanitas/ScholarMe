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
import { createClient } from "@/lib/supabase/client"

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

import { ErrorBoundary } from "@/components/error-boundary"

function QuizzesContent() {
  const [activeTab, setActiveTab] = useState("my-sets")
  const [myStudySets, setMyStudySets] = useState<StudySet[]>([])
  const [sharedStudySets, setSharedStudySets] = useState<StudySet[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "mixed" as any,
    is_public: false,
    content: "",
    source_resource_id: "",
  })
  const [structuredItems, setStructuredItems] = useState<any[]>([])
  const [targetChapters, setTargetChapters] = useState("")
  const [userContext, setUserContext] = useState("")
  const [quizConfig, setQuizConfig] = useState({
    multiple_choice: { enabled: true, count: 5, choices: 4 },
    true_false: { enabled: true, count: 5 },
    matching_type: { enabled: false, count: 5 },
    modified_true_false: { enabled: false, count: 5 },
    identification: { enabled: false, count: 5 },
    fill_in_the_blanks: { enabled: false, count: 5 },
  })

  const [resources, setResources] = useState<any[]>([])
  const [selectedResource, setSelectedResource] = useState("")
  const [extractedTopics, setExtractedTopics] = useState<string[]>([])
  const [extractingTopics, setExtractingTopics] = useState(false)
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])

  const [aiPrompt, setAiPrompt] = useState("")
  const [aiCount, setAiCount] = useState(5)
  const [generating, setGenerating] = useState(false)
  const [creationMethod, setCreationMethod] = useState("manual")

        const loadResources = async () => {
    const supabase = createClient()
    const { data } = await supabase.from("resources").select("id, title").order("created_at", { ascending: false })
    if (data) setResources(data)
  }

  useEffect(() => {
    loadStudySets()
    loadResources()
  }, [])

  useEffect(() => {
    async function extractTopics(resourceId: string) {
      setExtractingTopics(true)
      try {
        const res = await fetch("/api/resources/extract-topics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resource_id: resourceId }),
        })
        const data = await res.json()
        if (data.topics) {
          setExtractedTopics(data.topics)
          setSelectedTopics([])
        }
      } catch (e) {
        console.error(e)
      } finally {
        setExtractingTopics(false)
      }
    }
    if (selectedResource) {
      extractTopics(selectedResource)
    } else {
      setExtractedTopics([])
      setSelectedTopics([])
    }
  }, [selectedResource])

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev => prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic])
  }

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

  const handleGenerateQuiz = async () => {
    if (!aiPrompt) {
      toast.error("Please enter a topic to generate questions about")
      return
    }

    try {
      setGenerating(true)
      
      const enabledTypes = Object.entries(quizConfig).filter(([_, conf]) => conf.enabled);
      const derivedType = enabledTypes.length === 1 ? enabledTypes[0][0] : "mixed";
      const totalCount = enabledTypes.reduce((acc, [_, conf]) => acc + conf.count, 0) || aiCount;

      const res = await fetch("/api/quizzes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: aiPrompt,
          type: derivedType,
          count: totalCount,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to generate questions")
      }

      const data = await res.json()
      if (data.data && Array.isArray(data.data)) {
        const newContent = data.data
          .map((item: any) => `Q: ${item.question}\nA: ${item.answer}`)
          .join("\n\n")
        
        setFormData(prev => ({
          ...prev,
          content: prev.content ? prev.content + "\n\n" + newContent : newContent
        }))
        
        toast.success("Questions generated successfully!")
        setCreationMethod("manual") // Switch back so they can see the generated content
      }
    } catch (error) {
      console.error("Error generating questions:", error)
      toast.error(error instanceof Error ? error.message : "Failed to generate questions")
    } finally {
      setGenerating(false)
    }
  }

  const handleGenerateFromResource = async () => {
    if (!selectedResource) return;
    try {
      setGenerating(true)
      
      // Build question types config from state
      const question_types: any = {}
      Object.entries(quizConfig).forEach(([key, val]) => {
        if (val.enabled) {
          question_types[key] = {
            enabled: true,
            question_count: val.count,
            ...(key === 'multiple_choice' ? { choices_per_question: (val as any).choices } : {})
          }
        }
      })
      
      if (Object.keys(question_types).length === 0) {
        toast.error("Please enable at least one question type")
        setGenerating(false)
        return
      }

      const res = await fetch("/api/quizzes/generate-from-resource", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resource_id: selectedResource,
          config: {
             user_context: userContext,
             target_chapters: selectedTopics.length > 0 ? selectedTopics.join(", ") : targetChapters,
             generate_flashcards: false,
             generate_quiz: true,
             question_types
          }
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to generate from resource")
      }

      const { data } = await res.json()
      const items = data.questions;
      
      if (items && Array.isArray(items)) {
        setStructuredItems(items)
        setFormData(prev => ({
          ...prev,
          source_resource_id: selectedResource,
          type: "mixed"
        }))
        toast.success("Content generated successfully from resource!")
      } else {
        toast.error("No questions found in the generated response.")
      }
    } catch (error) {
      console.error("Error generating from resource:", error)
      toast.error(error instanceof Error ? error.message : "Failed to generate")
    } finally {
      setGenerating(false)
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

      let items: any[] = []
      
      if (structuredItems.length > 0) {
        items = structuredItems.map(item => ({
          question: item.question || item.front || item.instructions || "Matching Type",
          answer: item.correct_answer || item.answer || item.back || JSON.stringify(item.correct_matches || []),
          options: item.choices?.map((c: any) => c.text) || item.accepted_answers || item.responses || null,
          item_type: item.type || formData.type
        }))
      } else {
        // Parse content into items (format: "Q: question A: answer" per line)
        const lines = formData.content.split("\n").filter(line => line.trim())
        items = lines.map((line) => {
          const match = line.match(/Q:\s*(.+?)\s+A:\s*(.+)/i)
          if (match) {
            return {
              question: match[1].trim(),
              answer: match[2].trim(),
              item_type: formData.type,
            }
          }
          return null
        }).filter(Boolean)
      }

      if (items.length === 0) {
        toast.error("Please add at least one question")
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
          source_type: formData.source_resource_id ? "resource" : "manual",
          source_resource_id: formData.source_resource_id || undefined,
          items,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to create study set")
      }

      toast.success("Study set created!")
      
      // Earn XP
      const { earnXp } = await import("@/lib/utils/gamification")
      const xpData = await earnXp(25, "Created Quiz")
      if (xpData.success) {
        toast.success(`🎉 +25 XP Earned!`, {
          description: xpData.current_level ? `You are now Level ${xpData.current_level}` : "Keep building your knowledge base!",
        })
      }

      setFormData({ title: "", description: "", type: "mixed", is_public: false, content: "", source_resource_id: "" })
      setStructuredItems([])
      setUserContext("")
      setTargetChapters("")
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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

            <div className="space-y-3 p-4 bg-zinc-900/50 rounded-lg border border-border">
              <Label className="text-sm font-semibold">Question Types Configuration</Label>
              <p className="text-xs text-muted-foreground mb-2">Select types and quantities. Applies to all creation methods.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(quizConfig).map(([key, config]) => (
                  <div key={key} className="flex items-center justify-between p-2 border border-border/60 rounded-md bg-zinc-950">
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id={'quiz_'+key} 
                        checked={config.enabled} 
                        onChange={(e) => setQuizConfig(prev => ({ ...prev, [key]: { ...prev[key as keyof typeof prev], enabled: e.target.checked } }))} 
                        disabled={generating || creating}
                        className="rounded border-zinc-700 bg-zinc-900 w-4 h-4 cursor-pointer"
                      />
                      <Label htmlFor={'quiz_'+key} className="capitalize cursor-pointer text-xs">{key.replace(/_/g, ' ')}</Label>
                    </div>
                    {config.enabled && (
                      <Input 
                        type="number" 
                        min="1" max="50" 
                        className="w-16 h-7 text-xs px-2" 
                        value={config.count}
                        onChange={(e) => setQuizConfig(prev => ({ ...prev, [key]: { ...prev[key as keyof typeof prev], count: Math.max(1, parseInt(e.target.value) || 1) } }))}
                        disabled={generating || creating}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Tabs value={creationMethod} onValueChange={setCreationMethod} className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="manual" className="flex-1">Manual Entry</TabsTrigger>
                <TabsTrigger value="ai" className="flex-1 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Generate with AI
                </TabsTrigger>
                <TabsTrigger value="resource" className="flex-1 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  From Resource
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="manual" className="space-y-2 mt-4">
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
              </TabsContent>

              <TabsContent value="ai" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>What should the study set be about?</Label>
                  <Textarea
                    placeholder="e.g. The history of the Roman Empire, focusing on Julius Caesar"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    disabled={generating}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Number of questions</Label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={aiCount}
                    onChange={(e) => setAiCount(parseInt(e.target.value) || 5)}
                    disabled={generating}
                  />
                </div>
                <Button 
                  type="button" 
                  onClick={handleGenerateQuiz} 
                  disabled={generating || !aiPrompt}
                  className="w-full"
                  variant="secondary"
                >
                  {generating ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                  ) : (
                    "Generate Questions"
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="resource" className="space-y-4 mt-4">
                {structuredItems.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <Label className="text-base font-semibold">Generated Preview ({structuredItems.length} items)</Label>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setStructuredItems([])}>
                        Clear
                      </Button>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                      {structuredItems.map((item, i) => (
                        <div key={i} className="p-3 bg-muted rounded-md text-sm">
                          <div className="flex items-start justify-between mb-1">
                            <span className="font-medium">Q: {item.question || item.instructions || "Question"}</span>
                            <Badge variant="outline" className="ml-2 text-[10px] uppercase shrink-0">{item.type?.replace(/_/g, ' ')}</Badge>
                          </div>
                          <p className="text-muted-foreground">A: {item.correct_answer || item.answer || "Check DB"}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground text-center">Click Create Study Set to save these questions.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Select Resource</Label>
                      <Select value={selectedResource} onValueChange={setSelectedResource} disabled={generating}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a document/PDF" />
                        </SelectTrigger>
                        <SelectContent>
                          {resources.map(r => (
                            <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    
                    {extractingTopics ? (
                      <div className="flex items-center gap-2 p-4 text-sm text-zinc-400 bg-zinc-900/30 rounded-lg">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Scanning document for chapters and topics...
                      </div>
                    ) : extractedTopics.length > 0 ? (
                      <div className="space-y-2">
                        <Label>Select Topics to Include</Label>
                        <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto p-2 border border-border/50 rounded-md bg-zinc-950">
                          {extractedTopics.map(topic => (
                            <div key={topic} className="flex items-start space-x-2">
                              <input 
                                type="checkbox" 
                                id={'topic_'+topic}
                                checked={selectedTopics.includes(topic)}
                                onChange={() => toggleTopic(topic)}
                                className="mt-1 rounded border-zinc-700 bg-zinc-900 w-4 h-4 cursor-pointer shrink-0"
                              />
                              <Label htmlFor={'topic_'+topic} className="text-xs cursor-pointer leading-tight">{topic}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label>Target Chapters/Topics</Label>
                        <Input 
                          placeholder="e.g. Chapter 3, Photosynthesis (Enter manually)" 
                          value={targetChapters}
                          onChange={e => setTargetChapters(e.target.value)}
                          disabled={generating}
                        />
                      </div>
                    )}
                    <div className="space-y-2 mt-4">
                      <Label>Context / Instructions</Label>
                      <Input 
                        placeholder="e.g. Focus on definitions" 
                        value={userContext}
                        onChange={e => setUserContext(e.target.value)}
                        disabled={generating}
                      />
                    </div>

                    
                    <Button 
                      type="button" 
                      onClick={handleGenerateFromResource} 
                      disabled={generating || !selectedResource}
                      className="w-full mt-4"
                      variant="secondary"
                    >
                      {generating ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Extracting from Resource...</>
                      ) : (
                        "Generate Questions"
                      )}
                    </Button>
                  </>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex gap-2 justify-end pt-4 border-t">
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

export default function QuizzesPage() {
  return (
    <ErrorBoundary>
      <QuizzesContent />
    </ErrorBoundary>
  )
}
