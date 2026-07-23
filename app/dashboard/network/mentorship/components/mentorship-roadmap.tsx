"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Target, Award, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface MilestoneStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export function MentorshipRoadmap() {
  const [steps, setSteps] = useState<MilestoneStep[]>([
    {
      id: "step-1",
      title: "Step 1: Academic Goal Setting & Diagnostic",
      description: "Discuss target courses, identified weak study topics, and semester GPA goals.",
      completed: false,
    },
    {
      id: "step-2",
      title: "Step 2: Study Strategy & Flashcard Deck Sharing",
      description: "Share recommended Spaced Repetition study sets and PLC tutoring schedules.",
      completed: false,
    },
    {
      id: "step-3",
      title: "Step 3: Industry Portfolio & Resume Review",
      description: "Review public shareable portfolio link, GitHub projects, and verified credentials.",
      completed: false,
    },
    {
      id: "step-4",
      title: "Step 4: Honor Society Officer Transition Shadowing",
      description: "Shadow an active committee meeting or PLC duty shift to prepare for leadership.",
      completed: false,
    },
  ]);

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPct = Math.round((completedCount / steps.length) * 100);

  const toggleStep = (id: string) => {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const nextState = !s.completed;
          if (nextState) {
            toast.success(`Completed: ${s.title}`);
          }
          return { ...s, completed: nextState };
        }
        return s;
      })
    );

    if (completedCount + 1 === steps.length) {
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
      toast.success("Mentorship Goal Roadmap Completed! +250 XP Awarded! 🌟", { duration: 5000 });
    }
  };

  return (
    <Card className="border bg-card/60 backdrop-blur shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" /> Mentorship Goal Roadmap
            </CardTitle>
            <CardDescription className="text-xs">
              4-Step structured guidance milestones for mentors and mentees.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs gap-1 bg-amber-500/10 text-amber-600 border-amber-500/20">
            <Award className="h-3.5 w-3.5" /> +250 XP Reward
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-muted-foreground">Roadmap Completion</span>
            <span className="text-primary">{completedCount} of 4 Completed ({progressPct}%)</span>
          </div>
          <Progress value={progressPct} className="h-2" />
        </div>

        {/* Milestone Steps List */}
        <div className="space-y-3 pt-1">
          {steps.map((step) => (
            <div
              key={step.id}
              onClick={() => toggleStep(step.id)}
              className={`p-3 rounded-lg border text-xs transition-all cursor-pointer flex items-start gap-3 ${
                step.completed ? "bg-primary/5 border-primary/30" : "bg-card hover:bg-muted/30"
              }`}
            >
              <Checkbox
                checked={step.completed}
                onCheckedChange={() => toggleStep(step.id)}
                className="mt-0.5"
              />
              <div className="space-y-0.5 flex-1">
                <div className={`font-semibold ${step.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                  {step.title}
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  {step.description}
                </p>
              </div>
              {step.completed && (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
