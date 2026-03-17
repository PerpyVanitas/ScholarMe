'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Play, Trash2, Share2, Loader2, BookOpen, Grid, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface StudySet {
  id: string;
  title: string;
  description?: string;
  generation_mode: string;
  difficulty: string;
  question_count: number;
  visibility: string;
  created_at: string;
}

export default function StudySetsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const viewMode = searchParams.get('shared') === 'true' ? 'shared' : 'my';

  const [studySets, setStudySets] = useState<StudySet[]>([]);
  const [sharedSets, setSharedSets] = useState<StudySet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGeneratorDialog, setShowGeneratorDialog] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [copiedSetId, setCopiedSetId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [generationMode, setGenerationMode] = useState('flashcard');
  const [difficulty, setDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState('10');
  const [visibility, setVisibility] = useState('private');

  useEffect(() => {
    loadStudySets();
  }, [viewMode]);

  const loadStudySets = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth/sign-in');
        return;
      }

      if (viewMode === 'my') {
        // Load user's own study sets
        const { data, error } = await supabase
          .from('study_sets')
          .select('*')
          .eq('owner_id', user.id)
          .eq('archived', false)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setStudySets(data || []);
      } else {
        // Load shared study sets from other users
        const { data, error } = await supabase
          .from('study_sets')
          .select('*')
          .eq('visibility', 'shared')
          .neq('owner_id', user.id)
          .eq('archived', false)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setSharedSets(data || []);
      }
    } catch (error) {
      console.error('Error loading study sets:', error);
      toast.error('Failed to load study sets');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySetId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedSetId(id);
    toast.success('Study set ID copied to clipboard');
    setTimeout(() => setCopiedSetId(null), 2000);
  };

  const handleGenerateSet = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in title and content');
      return;
    }

    setGeneratingId('generating');
    try {
      const response = await fetch('/api/study-sets/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          content,
          generationMode,
          difficulty,
          questionCount: parseInt(questionCount),
          visibility,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate study set');
      }

      toast.success(`Created "${title}" with ${data.itemCount} questions!`);
      
      // Reset form
      setTitle('');
      setDescription('');
      setContent('');
      setGeneratingId(null);
      setShowGeneratorDialog(false);

      // Reload study sets
      loadStudySets();
    } catch (error) {
      console.error('Error generating study set:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate study set');
      setGeneratingId(null);
    }
  };

  const handleDeleteSet = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this study set?')) return;

    try {
      const { error } = await supabase
        .from('study_sets')
        .update({ archived: true })
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Study set deleted');
      setStudySets(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting study set:', error);
      toast.error('Failed to delete study set');
    }
  };

  const handleStartStudy = (id: string) => {
    router.push(`/dashboard/study/${id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="w-8 h-8" />
            Study Sets
          </h1>
          <p className="text-muted-foreground mt-1">
            {viewMode === 'my' 
              ? 'Create and manage your flashcard and quiz study sets'
              : 'Explore study sets shared by other users'}
          </p>
        </div>
        {viewMode === 'my' && (
          <Button
            onClick={() => setShowGeneratorDialog(true)}
            size="lg"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Create New Set
          </Button>
        )}
      </div>

      {/* Tabs for My Sets vs Shared Sets */}
      <Tabs value={viewMode} onValueChange={(value) => {
        const url = new URL(window.location);
        if (value === 'shared') {
          url.searchParams.set('shared', 'true');
        } else {
          url.searchParams.delete('shared');
        }
        router.push(url.pathname + url.search);
      }}>
        <TabsList>
          <TabsTrigger value="my">My Study Sets</TabsTrigger>
          <TabsTrigger value="shared">Shared Study Sets</TabsTrigger>
        </TabsList>
        <TabsContent value={viewMode} className="space-y-4">
          {/* Placeholder - content below handles both */}
        </TabsContent>
      </Tabs>

      {/* Generator Dialog */}
      <Dialog open={showGeneratorDialog} onOpenChange={setShowGeneratorDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Study Set</DialogTitle>
            <DialogDescription>
              Create flashcards and quizzes powered by AI. Paste your study material and customize the generation settings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Biology Chapter 5"
                  disabled={generatingId === 'generating'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="generation-mode">Type *</Label>
                <Select value={generationMode} onValueChange={setGenerationMode} disabled={generatingId === 'generating'}>
                  <SelectTrigger id="generation-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flashcard">Flashcard</SelectItem>
                    <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                    <SelectItem value="true_false">True/False</SelectItem>
                    <SelectItem value="identification">Identification</SelectItem>
                    <SelectItem value="mixed">Mixed Types</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select value={difficulty} onValueChange={setDifficulty} disabled={generatingId === 'generating'}>
                  <SelectTrigger id="difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="question-count">Number of Questions</Label>
                <Input
                  id="question-count"
                  type="number"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(e.target.value)}
                  min="1"
                  max="100"
                  disabled={generatingId === 'generating'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description of your study set"
                disabled={generatingId === 'generating'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Study Material *</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste your lecture notes, textbook content, or study material here..."
                className="min-h-[150px]"
                disabled={generatingId === 'generating'}
              />
              <p className="text-xs text-muted-foreground">
                Tip: Include key concepts, definitions, and important facts
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="visibility">Visibility</Label>
              <Select value={visibility} onValueChange={setVisibility} disabled={generatingId === 'generating'}>
                <SelectTrigger id="visibility">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private (Only you)</SelectItem>
                  <SelectItem value="shared">Shared (Anyone with link)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowGeneratorDialog(false)}
              disabled={generatingId === 'generating'}
            >
              Cancel
            </Button>
            <Button onClick={handleGenerateSet} disabled={generatingId === 'generating'}>
              {generatingId === 'generating' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Set
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Study Sets Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (viewMode === 'my' && studySets.length === 0) || (viewMode === 'shared' && sharedSets.length === 0) ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <BookOpen className="w-12 h-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">
              {viewMode === 'my' ? 'No study sets yet' : 'No shared study sets'}
            </h3>
            <p className="text-muted-foreground text-center max-w-xs">
              {viewMode === 'my' 
                ? 'Create your first study set by pasting content and letting AI generate questions'
                : 'No one has shared any study sets yet'}
            </p>
            {viewMode === 'my' && (
              <Button onClick={() => setShowGeneratorDialog(true)} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Create First Set
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(viewMode === 'my' ? studySets : sharedSets).map((set) => (
            <Card key={set.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <Badge variant={set.visibility === 'shared' ? 'default' : 'secondary'}>
                    {set.generation_mode}
                  </Badge>
                  <Badge variant="outline">{set.difficulty}</Badge>
                </div>
                <CardTitle className="text-lg line-clamp-2">{set.title}</CardTitle>
                {set.description && (
                  <CardDescription className="line-clamp-2">{set.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  {set.question_count} questions
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleStartStudy(set.id)}
                    className="flex-1"
                    size="sm"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Study
                  </Button>
                  {viewMode === 'my' && set.visibility === 'shared' && (
                    <Button 
                      onClick={() => handleCopySetId(set.id)}
                      variant="outline" 
                      size="sm"
                      title="Copy shareable link"
                    >
                      {copiedSetId === set.id ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                  {viewMode === 'my' && (
                    <Button
                      onClick={() => handleDeleteSet(set.id)}
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
