'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CheckCircle2, XCircle, RotateCw, Home, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface StudyItem {
  id: string;
  item_type: string;
  prompt: string;
  answer: string;
  options?: string[];
  explanation?: string;
}

interface StudySet {
  id: string;
  title: string;
  description?: string;
  generation_mode: string;
  question_count: number;
}

export default function StudyPage() {
  const params = useParams();
  const router = useRouter();
  const studySetId = params.id as string;
  const supabase = createClient();

  const [studySet, setStudySet] = useState<StudySet | null>(null);
  const [items, setItems] = useState<StudyItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudySet();
  }, [studySetId]);

  const loadStudySet = async () => {
    try {
      setLoading(true);
      const { data: studySetData } = await supabase
        .from('study_sets')
        .select('*')
        .eq('id', studySetId)
        .single();

      if (!studySetData) {
        toast.error('Study set not found');
        router.push('/dashboard/study-sets');
        return;
      }

      setStudySet(studySetData);

      const { data: itemsData } = await supabase
        .from('study_set_items')
        .select('*')
        .eq('study_set_id', studySetId)
        .order('order_index', { ascending: true });

      if (itemsData) {
        setItems(itemsData);
      }
    } catch (error) {
      console.error('Error loading study set:', error);
      toast.error('Failed to load study set');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [currentIndex]: answer,
    }));
  };

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      setSelectedAnswer('');
    } else {
      finishStudy();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
      setSelectedAnswer('');
    }
  };

  const finishStudy = async () => {
    // Calculate score
    let correctCount = 0;
    items.forEach((item, index) => {
      const userAnswer = userAnswers[index];
      if (userAnswer === item.answer || 
          (item.options && item.options.includes(userAnswer) && userAnswer === item.answer)) {
        correctCount++;
      }
    });

    const score = (correctCount / items.length) * 100;

    // Save attempt
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('quiz_attempts').insert({
          user_id: user.id,
          study_set_id: studySetId,
          score,
          total_items: items.length,
          answers: userAnswers,
          completed_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error saving quiz attempt:', error);
    }

    setShowResults(true);
  };

  const resetStudy = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setUserAnswers({});
    setShowResults(false);
    setSelectedAnswer('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!studySet) {
    return <div>Study set not found</div>;
  }

  if (showResults) {
    const correctCount = Object.entries(userAnswers).filter(([index, answer]) => {
      const item = items[parseInt(index)];
      return answer === item.answer;
    }).length;
    const percentage = (correctCount / items.length) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-3xl mb-2">Study Complete!</CardTitle>
              <p className="text-muted-foreground">You finished all {items.length} questions</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-6xl font-bold text-primary mb-2">{percentage.toFixed(0)}%</div>
                <p className="text-lg text-muted-foreground">
                  {correctCount} out of {items.length} correct
                </p>
              </div>

              <Progress value={percentage} className="h-3" />

              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-green-600">{correctCount}</div>
                    <p className="text-sm text-green-700">Correct Answers</p>
                  </CardContent>
                </Card>
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-red-600">{items.length - correctCount}</div>
                    <p className="text-sm text-red-700">Incorrect Answers</p>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={resetStudy} variant="outline" className="flex-1">
                  <RotateCw className="w-4 h-4 mr-2" />
                  Study Again
                </Button>
                <Button onClick={() => router.push('/dashboard/study-sets')} className="flex-1">
                  <Home className="w-4 h-4 mr-2" />
                  Back to Study Sets
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentItem = items[currentIndex];
  const progress = ((currentIndex + 1) / items.length) * 100;
  const userAnswer = userAnswers[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{studySet.title}</h1>
            <p className="text-sm text-muted-foreground">
              Question {currentIndex + 1} of {items.length}
            </p>
          </div>
          <Badge variant="secondary">{studySet.generation_mode}</Badge>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        {currentItem && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">{currentItem.prompt}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentItem.item_type === 'flashcard' && (
                <button
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="w-full p-8 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 cursor-pointer hover:border-primary/40 transition-colors min-h-[200px] flex items-center justify-center"
                >
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      {isFlipped ? 'Click to see question' : 'Click to reveal answer'}
                    </p>
                    <p className="text-lg font-semibold">
                      {isFlipped ? currentItem.answer : currentItem.prompt}
                    </p>
                  </div>
                </button>
              )}

              {currentItem.item_type === 'multiple_choice' && (
                <RadioGroup value={userAnswer} onValueChange={setSelectedAnswer}>
                  <div className="space-y-3">
                    {currentItem.options?.map((option) => (
                      <div key={option} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                        <RadioGroupItem value={option} id={option} />
                        <Label htmlFor={option} className="cursor-pointer flex-1">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              )}

              {currentItem.item_type === 'true_false' && (
                <RadioGroup value={userAnswer} onValueChange={setSelectedAnswer}>
                  <div className="space-y-3">
                    {['true', 'false'].map((option) => (
                      <div key={option} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                        <RadioGroupItem value={option} id={option} />
                        <Label htmlFor={option} className="cursor-pointer flex-1">
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              )}

              {currentItem.item_type === 'identification' && (
                <Input
                  placeholder="Type your answer here..."
                  value={userAnswer || ''}
                  onChange={(e) => setSelectedAnswer(e.target.value)}
                  className="text-base py-2"
                />
              )}

              {currentItem.explanation && (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-sm text-blue-900">
                    <strong>Explanation:</strong> {currentItem.explanation}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          <Button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            variant="outline"
            className="flex-1"
          >
            Previous
          </Button>
          <Button
            onClick={() => {
              if (currentItem.item_type === 'flashcard') {
                handleNext();
              } else {
                handleAnswer(selectedAnswer);
                handleNext();
              }
            }}
            className="flex-1"
          >
            {currentIndex === items.length - 1 ? 'Finish' : 'Next'}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
