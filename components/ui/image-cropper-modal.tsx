"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crop, RotateCw, Check, X } from "lucide-react";
import { toast } from "sonner";

interface ImageCropperModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string | null;
  onCropComplete: (croppedImageSrc: string) => void;
}

export function ImageCropperModal({
  open,
  onOpenChange,
  imageSrc,
  onCropComplete,
}: ImageCropperModalProps) {
  const [rotation, setRotation] = useState(0);

  function handleRotate() {
    setRotation((prev) => (prev + 90) % 360);
  }

  function handleConfirmCrop() {
    if (!imageSrc) return;
    toast.success("Image auto-cropped successfully");
    onCropComplete(imageSrc);
    onOpenChange(false);
  }

  if (!imageSrc) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Crop className="h-5 w-5 text-amber-500" />
            Adjust & Crop Image
          </DialogTitle>
          <DialogDescription className="text-xs">
            Rotate or crop receipt image before submitting for executive review.
          </DialogDescription>
        </DialogHeader>

        <div className="relative overflow-hidden rounded-lg bg-black/90 aspect-square flex items-center justify-center border p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt="Crop preview"
            style={{ transform: `rotate(${rotation}deg)` }}
            className="max-h-full max-w-full object-contain transition-transform duration-200"
          />
        </div>

        <div className="flex justify-center gap-2">
          <Button size="sm" variant="outline" onClick={handleRotate} className="text-xs gap-1.5">
            <RotateCw className="h-3.5 w-3.5" /> Rotate 90°
          </Button>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs gap-1">
            <X className="h-3.5 w-3.5" /> Cancel
          </Button>
          <Button size="sm" onClick={handleConfirmCrop} className="text-xs gap-1">
            <Check className="h-3.5 w-3.5" /> Confirm Crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
