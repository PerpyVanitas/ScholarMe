"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, BookOpen, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface Quiz {
  id: string;
  title: string;
  description: string;
  type: "multiple_choice" | "true_false" | "flashcard";
  difficulty: "easy" | "medium" | "hard";
  questions: Question[];
  created_at: string;
}

interface Question {
  id: string;
  prompt: string;
  answer: string;
  options?: string[];
  explanation?: string;
}

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "multiple_choice" as const,
    difficulty: "medium" as const,
    content: "",
  });

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data, error } = await supabase
        .from("study_sets")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setQuizzes(data || []);
    } catch (error) {
      console.error("Error loading quizzes:", error);
      toast.error("Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Not authenticated");

      // Parse content into questions (simple format: "Q: ? A: answer" per line)
      const lines = formData.content.split("\n").filter(line => line.trim());
      const questions: Question[] = lines.map((line, idx) => {
        const match = line.match(/Q:\s*(.+?)\s+A:\s*(.+)/);
        if (match) {
          return {
            id: `q-${idx}`,
            prompt: match[1],
            answer: match[2],
          };
        }
        return { id: `q-${idx}`, prompt: line, answer: "" };
      });

      const { error } = await supabase
        .from("study_sets")
        .insert({
          owner_id: user.id,
          title: formData.title,
          description: formData.description,
          source_type: "upload",
          generation_mode: formData.type,
          difficulty: formData.difficulty,
          question_count: questions.length,
          visibility: "private",
        });

      if (error) throw error;

      toast.success("Quiz created successfully");
      setFormData({ title: "", description: "", type: "multiple_choice", difficulty: "medium", content: "" });
      setDialogOpen(false);
      await loadQuizzes();
    } catch (error) {
      console.error("Error creating quiz:", error);
      toast.error("Failed to create quiz");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuiz = async (id: string) => {
    try {
      const supabase = await createClient();
      const { error } = await supabase
        .from("study_sets")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Quiz deleted");
      await loadQuizzes();
    } catch (error) {
      console.error("Error deleting quiz:", error);
      toast.error("Failed to delete quiz");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Study Quizzes</h1>
          <p className="text-sm text-muted-foreground">Create and manage your study quizzes</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Quiz
        </Button>
      </div>

      {/* Quiz List */}
      {loading && quizzes.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : quizzes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <BookOpen className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-center text-muted-foreground">No quizzes yet. Create your first one!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quizzes.map((quiz) => (
            <Card key={quiz.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle>{quiz.title}</CardTitle>
                    <CardDescription>{quiz.description || "No description"}</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteQuiz(quiz.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{quiz.generation_mode}</Badge>
                  <Badge variant="outline">{quiz.difficulty}</Badge>
                  <Badge variant="outline">{quiz.question_count} questions</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Quiz Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Quiz</DialogTitle>
            <DialogDescription>Add a new study quiz with questions and answers</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateQuiz} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Quiz Title</label>
              <Input
                placeholder="e.g., Biology Chapter 3"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                placeholder="Optional description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select value={formData.type} onValueChange={(v: any) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger disabled={loading}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                    <SelectItem value="true_false">True/False</SelectItem>
                    <SelectItem value="flashcard">Flashcard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Difficulty</label>
                <Select value={formData.difficulty} onValueChange={(v: any) => setFormData({ ...formData, difficulty: v })}>
                  <SelectTrigger disabled={loading}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Questions</label>
              <p className="text-xs text-muted-foreground">Format: Q: question text A: answer text (one per line)</p>
              <Textarea
                placeholder="Q: What is the capital of France? A: Paris
Q: What is 2+2? A: 4"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                disabled={loading}
                rows={6}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Create Quiz
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
