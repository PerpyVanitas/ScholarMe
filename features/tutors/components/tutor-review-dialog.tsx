"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Star } from "lucide-react";

export function TutorReviewDialog({
  open,
  onOpenChange,
  tutors,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tutors: unknown[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (data: unknown) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(5);

  const { register, handleSubmit, reset, setValue } = useForm();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFormSubmit = async (data: unknown) => {
    // @ts-ignore: Strict unknown type check
    if (!data.tutor_id) return;
    setLoading(true);
    // @ts-ignore: Strict unknown type check
    await onSubmit({ ...data, rating });
    setLoading(false);
    reset();
    setRating(5);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Write Peer Review</DialogTitle>
          <DialogDescription>
            Submit a performance evaluation for a junior tutor.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-4 py-4"
        >
          <div className="space-y-2">
            <Label htmlFor="tutor_id">Tutor</Label>
            <Select onValueChange={(val) => setValue("tutor_id", val)} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a tutor" />
              </SelectTrigger>
              <SelectContent>
                {tutors.map((t: any) => (
                  // @ts-ignore: Strict unknown type check
                  <SelectItem key={t.id} value={t.id}>
                    // @ts-ignore: Strict unknown type check
                    {t.profiles?.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-6 w-6 ${
                      star <= rating
                        ? "fill-primary text-primary"
                        : "text-muted"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback">Feedback</Label>
            <Textarea
              id="feedback"
              placeholder="Constructive feedback regarding their recent sessions..."
              {...register("feedback", { required: true })}
              rows={4}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Review
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
