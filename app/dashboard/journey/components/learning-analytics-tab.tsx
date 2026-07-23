"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { WeakTopicSuggestions } from "@/components/weak-topic-suggestions";
import { CompetencyRadarChart } from "@/components/competency-radar-chart";
import { LineChart, TrendingDown, TrendingUp, AlertTriangle, CheckCircle, Brain } from "lucide-react";

interface LearningAnalyticsTabProps {
  profile: Profile;
}

interface SubjectAccuracy {
  subject: string;
  totalAttempts: number;
  averageScore: number;
  recentScore: number;
  trend: "improving" | "declining" | "stable";
}

export function LearningAnalyticsTab({ profile }: LearningAnalyticsTabProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [subjectStats, setSubjectStats] = useState<SubjectAccuracy[]>([]);
  const [weakTopics, setWeakTopics] = useState<string[]>([]);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        // Fetch quiz attempts with study set details
        const { data: attempts } = await supabase
          .from("quiz_attempts")
          .select("score, total_questions, created_at, study_sets:study_set_id(title, subject)")
          .eq("user_id", profile.id)
          .order("created_at", { ascending: true });

        if (!attempts || attempts.length === 0) {
          setLoading(false);
          return;
        }

        // Group attempts by subject or title
        const groupMap: Record<
          string,
          { scores: number[]; dates: string[]; total: number }
        > = {};

        attempts.forEach((att) => {
          const rawStudySet = att.study_sets as unknown;
          const studySet = Array.isArray(rawStudySet)
            ? (rawStudySet[0] as { title?: string; subject?: string } | undefined)
            : (rawStudySet as { title?: string; subject?: string } | undefined);

          const subjectKey =
            studySet?.subject || studySet?.title || "General Practice";

          if (!groupMap[subjectKey]) {
            groupMap[subjectKey] = { scores: [], dates: [], total: 0 };
          }

          const scoreNum = typeof att.score === "number" ? att.score : 0;
          const totalNum = att.total_questions && att.total_questions > 0 ? att.total_questions : 1;
          const pct = Math.min(100, Math.max(0, Math.round((scoreNum / totalNum) * 100)));
          groupMap[subjectKey].scores.push(pct);
          groupMap[subjectKey].dates.push(att.created_at);
          groupMap[subjectKey].total += 1;
        });

        const statsList: SubjectAccuracy[] = [];
        const detectedWeak: string[] = [];

        Object.entries(groupMap).forEach(([subject, data]) => {
          const avg = Math.round(
            data.scores.reduce((a, b) => a + b, 0) / data.scores.length
          );
          const recent = data.scores[data.scores.length - 1];
          const previous =
            data.scores.length > 1 ? data.scores[data.scores.length - 2] : avg;

          let trend: "improving" | "declining" | "stable" = "stable";
          if (recent > previous + 5) trend = "improving";
          else if (recent < previous - 5) trend = "declining";

          statsList.push({
            subject,
            totalAttempts: data.total,
            averageScore: avg,
            recentScore: recent,
            trend,
          });

          // Weak topic criteria: average score < 70% or declining trend
          if (avg < 70 || trend === "declining") {
            detectedWeak.push(subject);
          }
        });

        setSubjectStats(statsList);
        setWeakTopics(detectedWeak);
      } catch (err) {
        console.error("Error computing learning analytics:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, [profile.id, supabase]);

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Analyzing quiz & flashcard performance trends...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" /> Real Learning Mastery Analytics
        </h3>
        <p className="text-sm text-muted-foreground">
          Subject-level accuracy trends computed strictly from your quiz attempt history — separate from activity XP.
        </p>
      </div>

      {/* 6-Axis Competency Radar Chart */}
      <CompetencyRadarChart
        competencies={subjectStats.map((s) => ({
          category: s.subject,
          score: s.averageScore,
        }))}
      />

      {/* Weak Topic Study Set Recommendations */}
      {weakTopics.length > 0 && <WeakTopicSuggestions weakTopics={weakTopics} />}

      {/* Subject Performance Breakdown */}
      {subjectStats.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjectStats.map((stat, i) => (
            <Card key={i} className="border bg-card">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base font-semibold">{stat.subject}</CardTitle>
                    <CardDescription className="text-xs">
                      {stat.totalAttempts} practice attempt{stat.totalAttempts > 1 ? "s" : ""}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      stat.trend === "improving"
                        ? "default"
                        : stat.trend === "declining"
                        ? "destructive"
                        : "outline"
                    }
                    className="gap-1 text-xs"
                  >
                    {stat.trend === "improving" && <TrendingUp className="h-3 w-3" />}
                    {stat.trend === "declining" && <TrendingDown className="h-3 w-3" />}
                    {stat.trend.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between text-muted-foreground mb-1">
                    <span>Average Accuracy</span>
                    <span className="font-bold text-foreground">{stat.averageScore}%</span>
                  </div>
                  <Progress value={stat.averageScore} className="h-2" />
                </div>

                <div className="flex justify-between items-center pt-2 border-t text-muted-foreground">
                  <span>Most Recent Score</span>
                  <span className="font-semibold text-foreground">{stat.recentScore}%</span>
                </div>

                {stat.averageScore < 70 && (
                  <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center gap-1.5 text-[11px]">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span>Identified as a weak topic needing focused practice.</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center text-muted-foreground space-y-2">
          <LineChart className="h-8 w-8 mx-auto text-muted-foreground/60" />
          <p className="font-medium text-foreground">No quiz attempts recorded yet</p>
          <p className="text-xs">Complete quizzes or flashcard sets under Study Sets to start tracking your real mastery trends.</p>
        </Card>
      )}
    </div>
  );
}
