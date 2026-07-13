"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

// Excalidraw must be imported dynamically to prevent SSR errors
const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    ),
  },
);

export default function WhiteboardPage() {
  const { id } = useParams();
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      // Verify session exists and user has access
      const { data } = await supabase
        .from("sessions")
        .select("*, tutors(*, profiles(*)), profiles!learner_id(*)")
        .eq("id", id)
        .single();

      if (data) {
        setSessionData(data);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Session not found</h1>
        <Button onClick={() => router.push("/dashboard/sessions")}>
          Go back to Sessions
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col w-full absolute inset-0 z-50 bg-background">
      {/* Top Header Bar */}
      <div className="flex h-14 items-center justify-between border-b px-4 shrink-0 bg-card">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/sessions")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">Session Whiteboard</span>
            <span className="text-xs text-muted-foreground">
              {sessionData.tutors?.profiles?.full_name} &{" "}
              {sessionData.profiles?.full_name}
            </span>
          </div>
        </div>
      </div>

      {/* Excalidraw Canvas */}
      <div className="flex-1 w-full relative">
        <Excalidraw
          theme="dark"
          UIOptions={{
            canvasActions: {
              changeViewBackgroundColor: true,
              clearCanvas: true,
              export: { saveFileToDisk: true },
              loadScene: false,
              saveToActiveFile: false,
              toggleTheme: true,
              saveAsImage: true,
            },
          }}
        />
      </div>
    </div>
  );
}
