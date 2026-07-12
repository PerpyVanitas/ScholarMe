"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ImageIcon, Trash2 } from "lucide-react";
import { OcclusionMask } from "@/features/quizzes/types";

interface ImageOcclusionEditorProps {
  imageUrl: string;
  masks: OcclusionMask[];
  onChange: (masks: OcclusionMask[]) => void;
}

export function ImageOcclusionEditor({ imageUrl, masks, onChange }: ImageOcclusionEditorProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentRect, setCurrentRect] = useState<{ x: number, y: number, w: number, h: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setStartPos({ x, y });
    setIsDrawing(true);
    setCurrentRect({ x, y, w: 0, h: 0 });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    
    setCurrentRect({
      x: Math.min(startPos.x, x),
      y: Math.min(startPos.y, y),
      w: Math.abs(x - startPos.x),
      h: Math.abs(y - startPos.y)
    });
  };

  const handlePointerUp = () => {
    if (isDrawing && currentRect && currentRect.w > 2 && currentRect.h > 2) {
      const newMask: OcclusionMask = {
        id: Math.random().toString(36).substr(2, 9),
        x: currentRect.x,
        y: currentRect.y,
        width: currentRect.w,
        height: currentRect.h
      };
      onChange([...masks, newMask]);
    }
    setIsDrawing(false);
    setCurrentRect(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs w-full mt-2" disabled={!imageUrl}>
          <ImageIcon className="w-3.5 h-3.5 mr-2" />
          Edit Occlusion Masks ({masks?.length || 0})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Image Occlusion Editor</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">Click and drag over the image to draw occlusion masks (boxes that hide parts of the image).</p>
          
          <div className="flex gap-4">
            <div 
              ref={containerRef}
              className="relative select-none border rounded-md overflow-hidden bg-muted/20"
              style={{ cursor: "crosshair", touchAction: "none" }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="Flashcard material" className="max-w-full max-h-[60vh] object-contain pointer-events-none" draggable={false} />
              
              {/* Render existing masks */}
              {masks?.map(mask => (
                <div 
                  key={mask.id}
                  className="absolute bg-yellow-400/80 border-2 border-yellow-500 group"
                  style={{ left: `${mask.x}%`, top: `${mask.y}%`, width: `${mask.width}%`, height: `${mask.height}%` }}
                >
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="absolute -top-3 -right-3 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(masks.filter(m => m.id !== mask.id));
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}

              {/* Render current drawing mask */}
              {isDrawing && currentRect && (
                <div 
                  className="absolute bg-yellow-400/50 border-2 border-yellow-500/80 border-dashed"
                  style={{ left: `${currentRect.x}%`, top: `${currentRect.y}%`, width: `${currentRect.w}%`, height: `${currentRect.h}%` }}
                />
              )}
            </div>
            
            <div className="w-48 flex flex-col gap-2">
              <h4 className="font-semibold text-sm">Masks</h4>
              {masks?.length === 0 && <p className="text-xs text-muted-foreground">No masks added.</p>}
              {masks?.map((mask, idx) => (
                <div key={mask.id} className="flex items-center justify-between p-2 bg-muted rounded border text-xs">
                  <span>Mask {idx + 1}</span>
                  <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => onChange(masks.filter(m => m.id !== mask.id))}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <Button variant="default" className="mt-auto" onClick={() => setOpen(false)}>Done</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
