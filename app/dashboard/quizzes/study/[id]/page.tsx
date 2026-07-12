"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import confetti from "canvas-confetti";
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  CheckCircle,
  XCircle,
  Loader2,
  Trophy,
  Clock,
  BookOpen,
  Shuffle,
  Flag,
  Volume2,
  Download
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { ImageOcclusionViewer } from "@/components/image-occlusion-viewer";
import { OcclusionMask } from "@/features/quizzes/types";

interface StudySetItem {
  id: string;
  question: string;
  answer: string;
  options: string[] | null;
  item_type: "flashcard" | "multiple_choice" | "true_false";
  image_url?: string;
  occlusion_masks?: OcclusionMask[];
  order_index: number;
}

interface StudySet {
  id: string;
  title: string;
  description: string | null;
  type: string;
  study_set_items: StudySetItem[];
  profiles?: { full_name: string };
}

export default function StudyModePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [studySet, setStudySet] = useState<StudySet | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [typedAnswer, setTypedAnswer] = useState("");
  const [answers, setAnswers] = useState<
    Record<string, { answer: string; correct: boolean }>
  >({});
  const [isComplete, setIsComplete] = useState(false);
  const [startTime] = useState(Date.now());
  const [shuffledItems, setShuffledItems] = useState<StudySetItem[]>([]);
  const [now, setNow] = useState<number>(0);
  
  // Customization Modes
  const [isTypingMode, setIsTypingMode] = useState(false);

  useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadStudySet();
  }, [id]);

  async function loadStudySet() {
    try {
      const res = await fetch(`/api/quizzes/${id}`);
      if (!res.ok) {
        throw new Error("Failed to load study set");
      }
      const data = await res.json();
      setStudySet(data.data);

      const items =
        data.data.study_set_items?.sort(
          (a: StudySetItem, b: StudySetItem) => a.order_index - b.order_index,
        ) || [];
      setShuffledItems(items);
    } catch (error) {
      toast.error("Failed to load study set");
      router.push("/dashboard/quizzes");
    } finally {
      setLoading(false);
    }
  }

  function shuffleItems() {
    if (
      Object.keys(answers).length > 0 &&
      !confirm(
        "Are you sure you want to shuffle? You will lose your current session progress.",
      )
    ) {
      return;
    }
    const shuffled = [...shuffledItems].sort(() => Math.random() - 0.5);
    setShuffledItems(shuffled);
    setCurrentIndex(0);
    setAnswers({});
    setShowAnswer(false);
    setSelectedAnswer("");
    setTypedAnswer("");
    setIsComplete(false);
    toast.success("Cards shuffled!");
  }

  function handleNext() {
    if (currentIndex < shuffledItems.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
      setSelectedAnswer("");
      setTypedAnswer("");
    } else {
      saveAttempt();
      setIsComplete(true);
    }
  }

  function handlePrevious() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowAnswer(false);
      setSelectedAnswer("");
      setTypedAnswer("");
    }
  }

  function handleAnswerSelect(answer: string) {
    setSelectedAnswer(answer);
    const currentItem = shuffledItems[currentIndex];
    const isCorrect = answer.toLowerCase() === currentItem.answer.toLowerCase();

    setAnswers({
      ...answers,
      [currentItem.id]: { answer, correct: isCorrect },
    });
    setShowAnswer(true);
  }

  function handleTypingSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!typedAnswer.trim()) return;
    const currentItem = shuffledItems[currentIndex];
    const isCorrect = typedAnswer.trim().toLowerCase() === currentItem.answer.toLowerCase();
    
    setAnswers({
      ...answers,
      [currentItem.id]: { answer: typedAnswer, correct: isCorrect },
    });
    setShowAnswer(true);
  }

  function handleSM2Rating(rating: "again" | "hard" | "good" | "easy") {
    // In a real scenario we'd send this to an API that updates flashcard_attempts SM2 columns
    // For now, record it as correct if good or easy
    const currentItem = shuffledItems[currentIndex];
    const isCorrect = rating === "good" || rating === "easy";
    
    setAnswers({
      ...answers,
      [currentItem.id]: { answer: rating, correct: isCorrect },
    });
    
    toast.success(`Rating recorded: ${rating}`);
    handleNext();
  }

  function handleRestart() {
    setCurrentIndex(0);
    setShowAnswer(false);
    setSelectedAnswer("");
    setTypedAnswer("");
    setAnswers({});
    setIsComplete(false);
  }

  function speakText(text: string) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    } else {
      toast.error("Text-to-speech not supported in this browser.");
    }
  }

  async function handleFlagQuestion() {
    const currentItem = shuffledItems[currentIndex];
    const reason = prompt(
      "Why are you flagging this question? (e.g., Inaccurate AI, typo)",
    );
    if (!reason) return;

    try {
      const res = await fetch("/api/quizzes/flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ study_set_item_id: currentItem.id, reason }),
      });
      if (res.ok) {
        toast.success("Question flagged for review.");
      } else {
        toast.error("Failed to flag question.");
      }
    } catch (e) {
      toast.error("An error occurred.");
    }
  }

  async function saveAttempt() {
    const correctCount = Object.values(answers).filter((a) => a.correct).length;
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    try {
      await fetch("/api/quizzes/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          study_set_id: id,
          score: correctCount,
          total_questions: shuffledItems.length,
          answers: Object.fromEntries(
            Object.entries(answers).map(([k, v]) => [k, v.answer]),
          ),
          time_spent_seconds: timeSpent,
        }),
      });

      // Earn XP for finishing a quiz
      await fetch("/api/gamification/xp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 50,
          reason: `Completed study set: ${studySet?.title}`,
        }),
      });

      if (correctCount / shuffledItems.length >= 0.8) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (error) {
      console.error("Failed to save attempt");
    }
  }

  if (loading || !studySet) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Loading set...</p>
        </div>
      </div>
    );
  }

  const currentItem = shuffledItems[currentIndex];
  const progress = ((currentIndex + (showAnswer ? 1 : 0)) / shuffledItems.length) * 100;

  if (isComplete) {
    const correctCount = Object.values(answers).filter((a) => a.correct).length;
    const score = Math.round((correctCount / shuffledItems.length) * 100);

    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/dashboard/quizzes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Quizzes
          </Link>
        </Button>

        <Card className="text-center p-8 border-border/60">
          <CardContent className="pt-6 flex flex-col items-center">
            <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <Trophy className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Quiz Complete!</h2>
            <p className="text-muted-foreground mb-8">
              You scored {correctCount} out of {shuffledItems.length}
            </p>

            <div className="text-5xl font-bold text-primary mb-8">{score}%</div>

            <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-8 text-left">
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Correct
                </div>
                <p className="text-2xl font-semibold">{correctCount}</p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <XCircle className="h-4 w-4 text-red-500" />
                  Incorrect
                </div>
                <p className="text-2xl font-semibold">
                  {shuffledItems.length - correctCount}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={handleRestart} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Study Again
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/quizzes">Return to Hub</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link href="/dashboard/quizzes">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <h1 className="text-xl font-bold flex items-center gap-3">
            {studySet.title}
            <Button variant="outline" size="sm" asChild>
              <a href={`/api/quizzes/${id}/export`} target="_blank" rel="noreferrer" title="Export to Quizlet/Anki CSV">
                <Download className="mr-1 h-3 w-3" />
                Export
              </a>
            </Button>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 mr-2">
            <Label htmlFor="typing-mode" className="text-xs text-muted-foreground">Typing Mode</Label>
            <Switch id="typing-mode" checked={isTypingMode} onCheckedChange={setIsTypingMode} />
          </div>
          <Button variant="outline" size="sm" onClick={shuffleItems}>
            <Shuffle className="mr-2 h-4 w-4" />
            Shuffle
          </Button>
          <Badge variant="secondary">
            {currentIndex + 1} / {shuffledItems.length}
          </Badge>
        </div>
      </div>

      {/* Progress */}
      <Progress value={progress} className="mb-6 h-2" />

      {/* Card */}
      <Card className="min-h-[300px] mb-6">
        <CardContent className="p-8">
          <div className="min-h-[220px]">
            <div className="flex justify-between items-center mb-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Question
              </p>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => speakText(currentItem.question)} title="Listen">
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleFlagQuestion}
                  title="Flag inaccurate question"
                >
                  <Flag className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
            <p className="text-xl font-medium mb-6">{currentItem.question}</p>
            {currentItem.image_url && (
              <div className="flex justify-center mb-6">
                <ImageOcclusionViewer 
                  imageUrl={currentItem.image_url} 
                  masks={currentItem.occlusion_masks || []} 
                  showAll={showAnswer} 
                />
              </div>
            )}

            {currentItem.item_type === "true_false" ? (
              <RadioGroup
                value={selectedAnswer}
                onValueChange={handleAnswerSelect}
                disabled={showAnswer}
              >
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50">
                  <RadioGroupItem value="true" id="true" />
                  <Label htmlFor="true" className="flex-1 cursor-pointer">
                    True
                  </Label>
                  {showAnswer &&
                    currentItem.answer.toLowerCase() === "true" && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50">
                  <RadioGroupItem value="false" id="false" />
                  <Label htmlFor="false" className="flex-1 cursor-pointer">
                    False
                  </Label>
                  {showAnswer &&
                    currentItem.answer.toLowerCase() === "false" && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                </div>
              </RadioGroup>
            ) : currentItem.options && currentItem.options.length > 0 ? (
              <RadioGroup
                value={selectedAnswer}
                onValueChange={handleAnswerSelect}
                disabled={showAnswer}
              >
                {currentItem.options.map((option, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 ${
                      showAnswer && option === currentItem.answer
                        ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                        : ""
                    } ${
                      showAnswer &&
                      selectedAnswer === option &&
                      option !== currentItem.answer
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20"
                        : ""
                    }`}
                  >
                    <RadioGroupItem value={option} id={`option-${idx}`} />
                    <Label
                      htmlFor={`option-${idx}`}
                      className="flex-1 cursor-pointer"
                    >
                      {option}
                    </Label>
                    {showAnswer && option === currentItem.answer && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {showAnswer &&
                      selectedAnswer === option &&
                      option !== currentItem.answer && (
                        <XCircle className="h-5 w-5 text-orange-500" />
                      )}
                  </div>
                ))}
              </RadioGroup>
            ) : (
              // Flashcard / Free text
              <div>
                {!showAnswer ? (
                  isTypingMode ? (
                    <form onSubmit={handleTypingSubmit} className="flex gap-2">
                      <Input 
                        placeholder="Type your answer here..." 
                        value={typedAnswer}
                        onChange={(e) => setTypedAnswer(e.target.value)}
                        autoFocus
                      />
                      <Button type="submit">Submit</Button>
                    </form>
                  ) : (
                    <Button
                      onClick={() => setShowAnswer(true)}
                      variant="outline"
                      className="w-full"
                    >
                      Show Answer
                    </Button>
                  )
                ) : (
                  <div className="p-4 bg-muted rounded-lg flex flex-col gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Correct Answer:
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-primary">
                          {currentItem.answer}
                        </p>
                        <Button variant="ghost" size="icon" onClick={() => speakText(currentItem.answer)} title="Listen">
                          <Volume2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                    
                    {isTypingMode && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Your Answer:</p>
                        <p className={`font-medium ${answers[currentItem.id]?.correct ? 'text-green-500' : 'text-red-500'}`}>
                          {typedAnswer}
                        </p>
                      </div>
                    )}

                    {!isTypingMode && (
                      <div className="border-t pt-4 mt-2">
                        <p className="text-sm font-medium mb-3 text-center">How well did you know this?</p>
                        <div className="grid grid-cols-4 gap-2">
                          <Button variant="outline" className="border-red-500/50 hover:bg-red-50 dark:hover:bg-red-950" onClick={() => handleSM2Rating("again")}>Again</Button>
                          <Button variant="outline" className="border-orange-500/50 hover:bg-orange-50 dark:hover:bg-orange-950" onClick={() => handleSM2Rating("hard")}>Hard</Button>
                          <Button variant="outline" className="border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-950" onClick={() => handleSM2Rating("good")}>Good</Button>
                          <Button variant="outline" className="border-green-500/50 hover:bg-green-50 dark:hover:bg-green-950" onClick={() => handleSM2Rating("easy")}>Easy</Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>
            {Math.floor(((now || Date.now()) - startTime) / 60000)}:
            {((((now || Date.now()) - startTime) / 1000) % 60)
              .toFixed(0)
              .padStart(2, "0")}
          </span>
        </div>

        <Button onClick={handleNext}>
          {currentIndex === shuffledItems.length - 1 ? "Finish" : "Next"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
