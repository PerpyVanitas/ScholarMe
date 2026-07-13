"use client";

import { useState } from "react";
import { OcclusionMask } from "@/features/quizzes/types";

interface ImageOcclusionViewerProps {
  imageUrl: string;
  masks: OcclusionMask[];
  showAll?: boolean;
}

export function ImageOcclusionViewer({
  imageUrl,
  masks,
  showAll = false,
}: ImageOcclusionViewerProps) {
  const [revealedMasks, setRevealedMasks] = useState<Set<string>>(new Set());

  const toggleMask = (id: string) => {
    setRevealedMasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  if (!imageUrl) return null;

  return (
    <div className="relative inline-block border rounded-md overflow-hidden bg-muted/20 my-4 max-w-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt="Flashcard visual"
        className="max-w-full max-h-[50vh] object-contain"
        draggable={false}
      />

      {masks?.map((mask) => {
        const isRevealed = showAll || revealedMasks.has(mask.id);

        return (
          <div
            key={mask.id}
            onClick={() => toggleMask(mask.id)}
            className={`absolute transition-all cursor-pointer ${isRevealed ? "bg-transparent border-2 border-yellow-500/50" : "bg-yellow-400 border-2 border-yellow-500 hover:bg-yellow-300"}`}
            style={{
              left: `${mask.x}%`,
              top: `${mask.y}%`,
              width: `${mask.width}%`,
              height: `${mask.height}%`,
              backdropFilter: isRevealed ? "none" : "blur(4px)",
            }}
            title={isRevealed ? "Click to hide" : "Click to reveal"}
          />
        );
      })}
    </div>
  );
}
