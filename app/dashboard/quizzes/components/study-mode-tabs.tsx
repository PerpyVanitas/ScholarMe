"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Layers,
  FileCheck,
  Brain,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Star,
  Volume2,
  Printer,
  Copy,
  CheckCircle,
  XCircle,
  Shuffle,
  Sparkles,
  Trophy,
} from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export interface StudyItem {
  id: string;
  question: string;
  answer: string;
  options?: string[] | null;
  item_type?: string;
  image_url?: string;
  order_index?: number;
}

export interface StudySetData {
  id: string;
  title: string;
  description?: string | null;
  type?: string;
  study_set_items: StudyItem[];
  profiles?: { full_name?: string };
}

interface StudyModeTabsProps {
  studySet: StudySetData;
  onDuplicate?: () => void;
}

export function StudyModeTabs({ studySet, onDuplicate }: StudyModeTabsProps) {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<"flashcards" | "test" | "learn">(
    "flashcards",
  );

  const items = useMemo(
    () => studySet.study_set_items || [],
    [studySet.study_set_items],
  );

  // ----------------------------------------------------
  // FLASHCARDS MODE STATE & LOGIC
  // ----------------------------------------------------
  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`study_pos_${studySet.id}`);
      return saved ? Math.min(parseInt(saved, 10), Math.max(0, items.length - 1)) : 0;
    }
    return 0;
  });
  const [showAnswer, setShowAnswer] = useState(false);
  const [starredItems, setStarredItems] = useState<Record<string, boolean>>({});
  const [filterStarredOnly, setFilterStarredOnly] = useState(false);

  // Touch swipe handling
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const activeItems = useMemo(() => {
    if (!filterStarredOnly) return items;
    return items.filter((item) => starredItems[item.id]);
  }, [items, starredItems, filterStarredOnly]);

  const currentCard = activeItems[currentIndex] || items[0];

  useEffect(() => {
    if (typeof window !== "undefined" && studySet.id) {
      localStorage.setItem(`study_pos_${studySet.id}`, currentIndex.toString());
    }
  }, [currentIndex, studySet.id]);

  const toggleStar = useCallback(
    (id: string) => {
      setStarredItems((prev) => {
        const next = { ...prev, [id]: !prev[id] };
        toast.info(next[id] ? "Card starred for targeted study" : "Unstarred card");
        return next;
      });
    },
    [],
  );

  const speakText = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.error("Text-to-speech not supported on this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }, []);

  const handleNextCard = useCallback(() => {
    setShowAnswer(false);
    setCurrentIndex((prev) => (prev + 1) % activeItems.length);
  }, [activeItems.length]);

  const handlePrevCard = useCallback(() => {
    setShowAnswer(false);
    setCurrentIndex((prev) => (prev - 1 + activeItems.length) % activeItems.length);
  }, [activeItems.length]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    if (activeTab !== "flashcards") return;

    function handleKeyDown(e: KeyboardEvent) {
      // Don't intercept when user is typing in an input or textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        setShowAnswer((prev) => !prev);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        handleNextCard();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        handlePrevCard();
      } else if (e.code === "KeyS" && currentCard) {
        e.preventDefault();
        toggleStar(currentCard.id);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, currentCard, handleNextCard, handlePrevCard, toggleStar]);

  // Touch Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (diff > 50) {
      handleNextCard(); // Swipe Left -> Next
    } else if (diff < -50) {
      handlePrevCard(); // Swipe Right -> Prev
    }
    setTouchStartX(null);
  };

  // ----------------------------------------------------
  // TEST MODE STATE & GENERATOR LOGIC
  // ----------------------------------------------------
  const generatedQuestions = useMemo(() => {
    return items.map((item, idx) => {
      // Create distractor options from other cards' answers
      const distractors = items
        .filter((_, i) => i !== idx)
        .map((other) => other.answer)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      const options = [item.answer, ...distractors].sort(() => 0.5 - Math.random());
      return {
        id: item.id,
        question: item.question,
        correctAnswer: item.answer,
        options,
      };
    });
  }, [items]);

  const [testAnswers, setTestAnswers] = useState<Record<string, string>>({});
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [testScore, setTestScore] = useState(0);

  const handleTestSubmit = () => {
    let score = 0;
    generatedQuestions.forEach((q) => {
      if (testAnswers[q.id]?.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
        score++;
      }
    });
    setTestScore(score);
    setTestSubmitted(true);
    if (score / generatedQuestions.length >= 0.7) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  };

  const resetTest = () => {
    setTestAnswers({});
    setTestSubmitted(false);
    setTestScore(0);
  };

  // ----------------------------------------------------
  // LEARN MODE ADAPTIVE LOGIC
  // ----------------------------------------------------
  const [learnQueue, setLearnQueue] = useState<StudyItem[]>(items);
  const [learnIndex, setLearnIndex] = useState(0);
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());
  const [learnAnswerInput, setLearnAnswerInput] = useState("");
  const [learnFeedback, setLearnFeedback] = useState<{
    correct: boolean;
    correctAnswer: string;
  } | null>(null);

  const currentLearnItem = learnQueue[learnIndex];

  const handleLearnCheck = (submittedAnswer: string) => {
    if (!currentLearnItem) return;
    const isCorrect =
      submittedAnswer.trim().toLowerCase() === currentLearnItem.answer.trim().toLowerCase();

    setLearnFeedback({ correct: isCorrect, correctAnswer: currentLearnItem.answer });

    if (isCorrect) {
      setMasteredIds((prev) => new Set([...prev, currentLearnItem.id]));
    } else {
      // Re-queue missed card to the end of the queue!
      setLearnQueue((prev) => [...prev, currentLearnItem]);

      // Record weak topic signal to Supabase profile metadata or log
      recordWeakTopic(studySet.title);
    }
  };

  const handleLearnNext = () => {
    setLearnFeedback(null);
    setLearnAnswerInput("");
    setLearnIndex((prev) => prev + 1);
  };

  const recordWeakTopic = async (topic: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      // Fetch user profile metadata to update weak topics list
      const { data: profile } = await supabase
        .from("profiles")
        .select("weak_topics")
        .eq("id", user.id)
        .single();

      const existing: string[] = profile?.weak_topics || [];
      if (!existing.includes(topic)) {
        await supabase
          .from("profiles")
          .update({ weak_topics: [...existing, topic] })
          .eq("id", user.id);
      }
    } catch {
      // Best-effort tracking
    }
  };

  // ----------------------------------------------------
  // PRINT & EXPORT LOGIC
  // ----------------------------------------------------
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>${studySet.title} — Study Sheet</title>
          <style>
            body { font-family: sans-serif; margin: 40px; }
            h1 { color: #1e293b; margin-bottom: 8px; }
            p { color: #64748b; font-size: 14px; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 24px; }
            th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e2e8f0; }
            th { background-color: #f8fafc; font-size: 14px; color: #475569; }
            td { font-size: 14px; }
            .num { width: 40px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <h1>${studySet.title}</h1>
          <p>${studySet.description || "Study set exported from ScholarMe."}</p>
          <table>
            <thead>
              <tr>
                <th class="num">#</th>
                <th>Term / Question</th>
                <th>Definition / Answer</th>
              </tr>
            </thead>
            <tbody>
              ${items
                .map(
                  (item, i) => `
                <tr>
                  <td class="num">${i + 1}</td>
                  <td><strong>${item.question}</strong></td>
                  <td>${item.answer}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{studySet.title}</h1>
            <Badge variant="secondary" className="text-xs">
              {items.length} Cards
            </Badge>
          </div>
          {studySet.description && (
            <p className="text-xs text-muted-foreground mt-1">{studySet.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="h-8 text-xs gap-1.5"
          >
            <Printer className="h-3.5 w-3.5" /> Print / Export
          </Button>

          {onDuplicate && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onDuplicate}
              className="h-8 text-xs gap-1.5"
            >
              <Copy className="h-3.5 w-3.5" /> Clone Set
            </Button>
          )}
        </div>
      </div>

      {/* Main Study Mode Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "flashcards" | "test" | "learn")}
      >
        <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto">
          <TabsTrigger value="flashcards" className="text-xs flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-primary" /> Flashcards
          </TabsTrigger>
          <TabsTrigger value="test" className="text-xs flex items-center gap-1.5">
            <FileCheck className="h-3.5 w-3.5 text-emerald-500" /> Test
          </TabsTrigger>
          <TabsTrigger value="learn" className="text-xs flex items-center gap-1.5">
            <Brain className="h-3.5 w-3.5 text-amber-500" /> Learn
          </TabsTrigger>
        </TabsList>

        {/* ==================================================== */}
        {/* TAB 1: FLASHCARDS MODE */}
        {/* ==================================================== */}
        <TabsContent value="flashcards" className="space-y-4 pt-4">
          {activeItems.length === 0 ? (
            <Card className="p-8 text-center space-y-3">
              <p className="text-sm font-medium">No starred cards found.</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setFilterStarredOnly(false)}
              >
                Show All Cards
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Progress & Shortcuts Bar */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>
                    Card {currentIndex + 1} of {activeItems.length}
                  </span>
                  {starredItems[currentCard?.id] && (
                    <Badge variant="secondary" className="text-[10px] text-amber-500 bg-amber-500/10">
                      Starred
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setFilterStarredOnly((prev) => !prev)}
                    className={`text-xs flex items-center gap-1 hover:text-foreground ${
                      filterStarredOnly ? "text-amber-500 font-semibold" : ""
                    }`}
                  >
                    <Star className="h-3.5 w-3.5 fill-current" />
                    {filterStarredOnly ? "Starred Only" : "Filter Starred"}
                  </button>
                  <span className="hidden sm:inline opacity-60">
                    Shortcut: Space to flip | ← → navigate | S to star
                  </span>
                </div>
              </div>

              <Progress
                value={((currentIndex + 1) / activeItems.length) * 100}
                className="h-1.5"
              />

              {/* Flip Card Stage */}
              <div
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onClick={() => setShowAnswer((prev) => !prev)}
                className="min-h-[320px] p-8 border-2 border-border/80 hover:border-primary/40 rounded-2xl bg-card shadow-sm cursor-pointer flex flex-col justify-between items-center text-center transition-all select-none relative group"
              >
                {/* Top Corner Action Buttons */}
                <div className="w-full flex justify-between items-center text-xs text-muted-foreground z-10">
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                    {showAnswer ? "Definition / Answer" : "Term / Question"}
                  </Badge>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-primary"
                      onClick={() => speakText(showAnswer ? currentCard.answer : currentCard.question)}
                      title="Listen with Speech Synthesis"
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={`h-7 w-7 ${
                        starredItems[currentCard.id]
                          ? "text-amber-500 fill-amber-500"
                          : "text-muted-foreground hover:text-amber-500"
                      }`}
                      onClick={() => toggleStar(currentCard.id)}
                      title="Star for review"
                    >
                      <Star className="h-4 w-4 fill-current" />
                    </Button>
                  </div>
                </div>

                {/* Main Card Content */}
                <div className="my-auto py-6 space-y-4 max-w-xl">
                  <p className="text-xl sm:text-2xl font-medium leading-relaxed tracking-tight">
                    {showAnswer ? currentCard.answer : currentCard.question}
                  </p>

                  {/* Optional Image */}
                  {currentCard.image_url && (
                    <img
                      src={currentCard.image_url}
                      alt="Card media"
                      className="max-h-48 rounded-lg mx-auto object-cover border"
                    />
                  )}
                </div>

                <p className="text-xs text-muted-foreground/60 font-medium">
                  Click or press Space to flip
                </p>
              </div>

              {/* Bottom Controls */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevCard}
                  className="gap-1 text-xs"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Previous
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAnswer((prev) => !prev)}
                  className="text-xs"
                >
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Flip Card
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextCard}
                  className="gap-1 text-xs"
                >
                  Next <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ==================================================== */}
        {/* TAB 2: TEST MODE */}
        {/* ==================================================== */}
        <TabsContent value="test" className="space-y-6 pt-4">
          {testSubmitted ? (
            <Card className="p-8 text-center space-y-4 max-w-lg mx-auto">
              <Trophy className="h-12 w-12 text-amber-500 mx-auto animate-bounce" />
              <div className="space-y-1">
                <h2 className="text-2xl font-bold">Test Completed!</h2>
                <p className="text-sm text-muted-foreground">
                  You scored {testScore} out of {generatedQuestions.length} (
                  {Math.round((testScore / generatedQuestions.length) * 100)}%)
                </p>
              </div>

              <Progress
                value={(testScore / generatedQuestions.length) * 100}
                className="h-2.5"
              />

              <div className="flex justify-center gap-3 pt-2">
                <Button size="sm" variant="outline" onClick={resetTest}>
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Retake Test
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h3 className="text-base font-semibold">Practice Test</h3>
                  <p className="text-xs text-muted-foreground">
                    Answer all questions based on set terms & definitions.
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={resetTest} className="h-8 text-xs">
                  <Shuffle className="mr-1.5 h-3.5 w-3.5" /> Shuffle
                </Button>
              </div>

              <div className="space-y-4">
                {generatedQuestions.map((q, idx) => (
                  <Card key={q.id} className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <Label className="text-sm font-medium leading-normal">
                        <span className="text-primary font-bold mr-1.5">{idx + 1}.</span>
                        {q.question}
                      </Label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = testAnswers[q.id] === opt;
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() =>
                              setTestAnswers((prev) => ({ ...prev, [q.id]: opt }))
                            }
                            className={`p-3 text-left text-xs rounded-xl border transition-all ${
                              isSelected
                                ? "border-primary bg-primary/10 font-semibold text-primary"
                                : "border-border/60 hover:bg-muted/30"
                            }`}
                          >
                            <span className="font-mono text-muted-foreground mr-2">
                              {String.fromCharCode(65 + optIdx)}.
                            </span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </Card>
                ))}
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  size="default"
                  onClick={handleTestSubmit}
                  disabled={Object.keys(testAnswers).length < generatedQuestions.length}
                  className="min-w-[140px]"
                >
                  <CheckCircle className="mr-2 h-4 w-4" /> Submit Answers
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ==================================================== */}
        {/* TAB 3: LEARN MODE (ADAPTIVE REPETITION) */}
        {/* ==================================================== */}
        <TabsContent value="learn" className="space-y-6 pt-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-base font-semibold">Adaptive Learn Mode</h3>
              <p className="text-xs text-muted-foreground">
                Master cards one by one. Cards you get wrong resurface until 100% mastered.
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              Mastered: {masteredIds.size} / {items.length}
            </Badge>
          </div>

          <Progress
            value={(masteredIds.size / items.length) * 100}
            className="h-2"
          />

          {masteredIds.size === items.length ? (
            <Card className="p-8 text-center space-y-4 max-w-lg mx-auto">
              <Sparkles className="h-12 w-12 text-amber-500 mx-auto animate-bounce" />
              <div className="space-y-1">
                <h2 className="text-2xl font-bold">Set Fully Mastered!</h2>
                <p className="text-sm text-muted-foreground">
                  You&apos;ve answered all {items.length} terms correctly.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setMasteredIds(new Set());
                  setLearnQueue(items);
                  setLearnIndex(0);
                }}
              >
                Restart Learn Cycle
              </Button>
            </Card>
          ) : currentLearnItem ? (
            <Card className="p-6 space-y-4 max-w-xl mx-auto">
              <div className="space-y-2 text-center">
                <Badge variant="outline" className="text-[10px]">
                  Card {learnIndex + 1} of {learnQueue.length}
                </Badge>
                <h4 className="text-xl font-medium pt-2">{currentLearnItem.question}</h4>
              </div>

              {!learnFeedback ? (
                <div className="space-y-3 pt-4">
                  <Input
                    placeholder="Type definition or answer..."
                    value={learnAnswerInput}
                    onChange={(e) => setLearnAnswerInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && learnAnswerInput.trim()) {
                        handleLearnCheck(learnAnswerInput);
                      }
                    }}
                    className="text-sm"
                  />
                  <div className="flex justify-between items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLearnCheck("")}
                      className="text-xs text-muted-foreground"
                    >
                      Don&apos;t know?
                    </Button>
                    <Button
                      size="sm"
                      disabled={!learnAnswerInput.trim()}
                      onClick={() => handleLearnCheck(learnAnswerInput)}
                    >
                      Check Answer
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pt-2 text-center">
                  <div
                    className={`p-4 rounded-xl text-sm font-medium border flex items-center justify-center gap-2 ${
                      learnFeedback.correct
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                        : "bg-destructive/10 text-destructive border-destructive/30"
                    }`}
                  >
                    {learnFeedback.correct ? (
                      <>
                        <CheckCircle className="h-5 w-5" /> Correct! Added to Mastered
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5" /> Incorrect — Will review again
                      </>
                    )}
                  </div>

                  {!learnFeedback.correct && (
                    <div className="text-left text-xs bg-muted/40 p-3 rounded-lg space-y-1">
                      <p className="text-muted-foreground">Correct Definition:</p>
                      <p className="font-semibold text-foreground">
                        {learnFeedback.correctAnswer}
                      </p>
                    </div>
                  )}

                  <Button size="sm" onClick={handleLearnNext} className="w-full">
                    Continue <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </Card>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
