"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";
import type { StudySet, StudySetItem } from "@/lib/study-set-types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function StudyPage() {
  const params = useParams();
  const id = params.id as string;

  const { data, isLoading, error } = useSWR(
    id ? `/api/study-sets/${id}` : null,
    fetcher
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const studySet: StudySet | undefined = data?.studySet;
  const items: StudySetItem[] = data?.items || [];
  const currentItem = items[currentIndex];

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleAnswerChange = (value: string) => {
    setAnswers({
      ...answers,
      [currentItem.id]: value,
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/study-sets/${id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: items.map((item) => ({
            itemId: item.id,
            answer: answers[item.id] || "",
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to submit quiz");
        return;
      }

      setScore(data.percentage);
      setSubmitted(true);
      toast.success(`Quiz completed! Score: ${data.percentage.toFixed(1)}%`);
    } catch (error) {
      toast.error("Failed to submit quiz");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !studySet) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Failed to load study set</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Quiz Complete!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-6xl font-bold text-primary">{score?.toFixed(1)}%</div>
            <p className="text-muted-foreground">Great job completing the quiz!</p>
            <Button onClick={() => window.location.reload()}>Retake Quiz</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{studySet.title}</h1>
          <p className="text-muted-foreground">{currentIndex + 1} of {items.length} questions</p>
        </div>
        <Badge variant="outline">{studySet.generation_mode}</Badge>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-secondary rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all"
          style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
        />
      </div>

      {/* Study item card */}
      <Card>
        <CardContent className="pt-6">
          {studySet.generation_mode === "flashcard" ? (
            <div
              className="min-h-64 p-8 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <div className="text-center space-y-4">
                <p className="text-sm font-semibold text-muted-foreground">
                  {isFlipped ? "Answer" : "Question"}
                </p>
                <p className="text-2xl font-semibold">
                  {isFlipped ? currentItem.answer : currentItem.prompt}
                </p>
                <p className="text-xs text-muted-foreground">Click to flip</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-4">
                  {currentItem.prompt}
                </p>
              </div>

              {currentItem.item_type === "multiple_choice" && currentItem.options && (
                <div className="space-y-3">
                  {currentItem.options.map((option: string, idx: number) => (
                    <label key={idx} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-secondary">
                      <input
                        type="radio"
                        name={`question-${currentItem.id}`}
                        value={option}
                        checked={answers[currentItem.id] === option}
                        onChange={(e) => handleAnswerChange(e.target.value)}
                        className="h-4 w-4"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {currentItem.item_type === "true_false" && (
                <div className="flex gap-3">
                  {["True", "False"].map((option) => (
                    <label key={option} className="flex-1 p-3 border rounded-lg cursor-pointer hover:bg-secondary">
                      <input
                        type="radio"
                        name={`question-${currentItem.id}`}
                        value={option}
                        checked={answers[currentItem.id] === option}
                        onChange={(e) => handleAnswerChange(e.target.value)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              )}

              {(currentItem.item_type === "identification" || currentItem.item_type === "matching") && (
                <input
                  type="text"
                  placeholder="Type your answer"
                  value={answers[currentItem.id] || ""}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              )}
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
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="text-sm text-muted-foreground">
          Question {currentIndex + 1} of {items.length}
        </div>

        {currentIndex < items.length - 1 ? (
          <Button onClick={handleNext}>
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <RotateCw className="h-4 w-4 mr-2" />
                Submit Quiz
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
