"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import { StudyModeTabs, StudySetData } from "../../components/study-mode-tabs";

export default function QuizStudyModePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [studySet, setStudySet] = useState<StudySetData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    loadStudySet(controller.signal);
    return () => controller.abort();
  }, [id]);

  async function loadStudySet(signal?: AbortSignal) {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/quizzes/${id}`, { signal });
      if (!res.ok) {
        throw new Error("Failed to load study set");
      }
      const data = await res.json();
      setStudySet(data.data);
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name === "AbortError") return;
      toast.error("Failed to load study set");
      router.push("/dashboard/study-sets");
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }

  const handleDuplicateSet = async () => {
    if (!studySet) return;
    try {
      const itemsToSubmit = studySet.study_set_items.map((item) => ({
        question: item.question,
        answer: item.answer,
        options: item.options || null,
        item_type: item.item_type || "flashcard",
      }));

      const res = await fetch("/api/v1/quizzes/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${studySet.title} (Copy)`,
          description: studySet.description,
          type: studySet.type || "flashcard",
          is_public: false,
          items: itemsToSubmit,
        }),
      });

      if (!res.ok) throw new Error("Failed to duplicate set");
      toast.success("Study set duplicated to your library!");
      router.push("/dashboard/study-sets");
    } catch {
      toast.error("Failed to clone study set");
    }
  };

  if (loading || !studySet) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Loading study set...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button variant="ghost" size="sm" asChild className="h-8 text-xs gap-1">
          <Link href="/dashboard/study-sets">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Study Sets
          </Link>
        </Button>
      </div>

      <StudyModeTabs studySet={studySet} onDuplicate={handleDuplicateSet} />
    </div>
  );
}
