"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { calculateSM2, type SM2Rating } from "@/lib/utils/sm2";
import { Volume2, Download } from "lucide-react";
interface StudySetItem {
  id: string;
  question: string;
  answer: string;
  options: string[] | null;
  item_type: "flashcard" | "multiple_choice" | "true_false";
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
  const [answers, setAnswers] = useState<
    Record<string, { answer: string; correct: boolean }>
  >({});
  const [isComplete, setIsComplete] = useState(false);
  const [startTime] = useState(Date.now());
  const [shuffledItems, setShuffledItems] = useState<StudySetItem[]>([]);

  useEffect(() => {
    loadStudySet();
  }, [id]);

  async function loadStudySet() {
    try {
      const res = await fetch(`/api/flashcards/${id}`);
      if (!res.ok) {
        throw new Error("Failed to load study set");
      }
      const data = await res.json();
      setStudySet(data.data);

      // Sort items by order_index
      const items =
        data.data.study_set_items?.sort(
          (a: StudySetItem, b: StudySetItem) => a.order_index - b.order_index,
        ) || [];
      setShuffledItems(items);
    } catch (error) {
      toast.error("Failed to load study set");
      router.push("/dashboard/flashcards");
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
    setIsComplete(false);
    toast.success("Cards shuffled!");
  }

  function handleNext() {
    if (currentIndex < shuffledItems.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
      setSelectedAnswer("");
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
    }
  }

  function handleFlip() {
    setShowAnswer(!showAnswer);
  }

  async function handleSM2Rating(rating: SM2Rating) {
    const currentItem = shuffledItems[currentIndex];

    // Save this to flashcard_attempts here via an API call
    try {
      const res = await fetch("/api/flashcards/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ study_set_item_id: currentItem.id, rating }),
      });
      if (!res.ok) {
        console.error("Failed to save flashcard attempt rating");
      }
    } catch (e) {
      console.error(e);
    }

    // Record it in state to calculate the correct percentage
    const isCorrect = rating >= 3;
    setAnswers({
      ...answers,
      [currentItem.id]: { answer: rating.toString(), correct: isCorrect },
    });

    handleNext();
  }

  function handleReadAloud(text: string, e: React.MouseEvent) {
    e.stopPropagation();
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    } else {
      toast.error("Text-to-speech is not supported in this browser.");
    }
  }

  function handleExportCsv() {
    if (!studySet) return;
    const csvRows = [
      ["Question", "Answer"],
      ...studySet.study_set_items.map((item) => [
        `"${item.question.replace(/"/g, '""')}"`,
        `"${item.answer.replace(/"/g, '""')}"`,
      ]),
    ];

    const csvString = csvRows.map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${studySet.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_flashcards.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleRestart() {
    setCurrentIndex(0);
    setShowAnswer(false);
    setSelectedAnswer("");
    setAnswers({});
    setIsComplete(false);
  }

  async function saveAttempt() {
    try {
      // Earn XP for finishing a flashcard set
      const { earnXp } = await import("@/lib/utils/gamification");
      const xpData = await earnXp("FLASHCARD_REVIEW_COMPLETED", "Reviewed Flashcards");
      if (xpData.success) {
        toast.success(`🎉 +50 XP Earned!`, {
          description: xpData.current_level
            ? `You are now Level ${xpData.current_level}`
            : "Great job completing the flashcards!",
        });
      }
    } catch (error) {
      console.error("Failed to earn XP:", error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!studySet || shuffledItems.length === 0) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card className="py-12">
          <CardContent className="text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No items to study</h3>
            <p className="text-muted-foreground mb-4">
              This study set has no questions yet.
            </p>
            <Button asChild>
              <Link href="/dashboard/flashcards">Back to Flashcards</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentItem = shuffledItems[currentIndex];
  const progress = ((currentIndex + 1) / shuffledItems.length) * 100;
  const correctCount = Object.values(answers).filter((a) => a.correct).length;

  // Results screen
  if (isComplete) {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(timeSpent / 60);
    const seconds = timeSpent % 60;
    const percentage = Math.round((correctCount / shuffledItems.length) * 100);

    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <Trophy className="h-16 w-16 mx-auto text-primary mb-4" />
            <CardTitle className="text-2xl">Study Session Complete!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold text-primary">{percentage}%</p>
                <p className="text-sm text-muted-foreground">Score</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold">
                  {correctCount}/{shuffledItems.length}
                </p>
                <p className="text-sm text-muted-foreground">Correct</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold">
                  {minutes}:{seconds.toString().padStart(2, "0")}
                </p>
                <p className="text-sm text-muted-foreground">Time</p>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={handleRestart}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Study Again
              </Button>
              <Button asChild>
                <Link href="/dashboard/flashcards">Back to Flashcards</Link>
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
            <Link href="/dashboard/flashcards">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <h1 className="text-xl font-bold">{studySet.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            title="Download as CSV for Anki/Quizlet"
          >
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
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
          <div
            className="cursor-pointer min-h-[220px] w-full"
            style={{ perspective: "1000px" }}
            onClick={handleFlip}
          >
            <div
              className="relative w-full h-full min-h-[220px] transition-transform duration-500 ease-in-out"
              style={{
                transformStyle: "preserve-3d",
                transform: showAnswer ? "rotateY(180deg)" : "rotateY(0deg)",
              }}
            >
              {/* Front (Question) */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-card"
                style={{ backfaceVisibility: "hidden" }}
              >
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-4">
                  Question
                </p>
                <p className="text-xl font-medium">{currentItem.question}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="mt-4 text-muted-foreground"
                  onClick={(e) => handleReadAloud(currentItem.question, e)}
                >
                  <Volume2 className="h-5 w-5" />
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Click to reveal answer
                </p>
              </div>

              {/* Back (Answer) */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-card"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-4">
                  Answer
                </p>
                <p className="text-xl font-medium text-primary">
                  {currentItem.answer}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="mt-4 text-muted-foreground"
                  onClick={(e) => handleReadAloud(currentItem.answer, e)}
                >
                  <Volume2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {showAnswer && (
            <div className="mt-8 pt-6 border-t animate-in slide-in-from-bottom-4 duration-300">
              <p className="text-sm font-medium text-center mb-4 text-muted-foreground">
                How hard was it to remember this?
              </p>
              <div className="flex gap-2 justify-center flex-wrap">
                <Button
                  variant="outline"
                  className="border-red-500/50 hover:bg-red-500/10"
                  onClick={() => handleSM2Rating(1)}
                >
                  Again (1)
                </Button>
                <Button
                  variant="outline"
                  className="border-orange-500/50 hover:bg-orange-500/10"
                  onClick={() => handleSM2Rating(3)}
                >
                  Hard (3)
                </Button>
                <Button
                  variant="outline"
                  className="border-green-500/50 hover:bg-green-500/10"
                  onClick={() => handleSM2Rating(4)}
                >
                  Good (4)
                </Button>
                <Button
                  variant="outline"
                  className="border-blue-500/50 hover:bg-blue-500/10"
                  onClick={() => handleSM2Rating(5)}
                >
                  Easy (5)
                </Button>
              </div>
            </div>
          )}
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
            {Math.floor((Date.now() - startTime) / 60000)}:
            {(((Date.now() - startTime) / 1000) % 60)
              .toFixed(0)
              .padStart(2, "0")}
          </span>
        </div>

        <Button onClick={showAnswer ? handleNext : handleFlip}>
          {showAnswer
            ? currentIndex === shuffledItems.length - 1
              ? "Finish"
              : "Next"
            : "Reveal"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
