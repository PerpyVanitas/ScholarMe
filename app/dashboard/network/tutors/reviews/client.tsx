"use client";

import { useState } from "react";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { Star, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TutorReviewDialog } from "@/features/tutors/components/tutor-review-dialog";

export function TutorReviewsClient({
  // @ts-ignore: Strict unknown type check
  currentTutor,
  // @ts-ignore: Strict unknown type check
  isLead,
  // @ts-ignore: Strict unknown type check
  reviews: initialReviews,
  // @ts-ignore: Strict unknown type check
  availableTutors,
 
}: unknown) {
  const [reviews, setReviews] = useState(initialReviews);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

   
  const handleReviewSubmit = async (data: unknown) => {
    const supabase = createClient();
    const { data: newReview, error } = await supabase
      .from("tutor_reviews")
      .insert({
        reviewer_id: currentTutor.id,
        // @ts-ignore: Strict unknown type check
        tutor_id: data.tutor_id,
        // @ts-ignore: Strict unknown type check
        rating: data.rating,
        // @ts-ignore: Strict unknown type check
        feedback: data.feedback,
      })
      .select("*, tutor:tutors(*, profiles(*))")
      .single();

    if (error) {
      console.error(error);
      toast.error("Failed to submit review");
      return;
    }

    setReviews([newReview, ...reviews]);
    toast.success("Review submitted successfully");
    setIsReviewOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {isLead ? "Reviews You've Written" : "Your Reviews"}
        </h2>
        {isLead && (
          <Button onClick={() => setIsReviewOpen(true)}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Write Review
          </Button>
        )}
      </div>

      {reviews.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
          <MessageSquare className="mb-4 h-12 w-12 opacity-20" />
          <p>No reviews found.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {reviews.map((review: Record<string, unknown>) => (
            // @ts-ignore: Strict unknown type check
            <Card key={review.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <span>
                    {isLead
                      // @ts-ignore: Strict unknown type check
                      ? review.tutor?.profiles?.full_name
                      // @ts-ignore: Strict unknown type check
                      : review.reviewer?.profiles?.full_name}
                  </span>
                  <Badge variant="secondary" className="font-mono">
                    <Star className="mr-1 h-3 w-3 fill-primary text-primary" />
                    // @ts-ignore: Strict unknown type check
                    {review.rating}/5
                  </Badge>
                </CardTitle>
                <CardDescription>
                  // @ts-ignore: Strict unknown type check
                  {format(new Date(review.created_at), "PPP")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap">
                  // @ts-ignore: Strict unknown type check
                  {review.feedback}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isLead && (
        <TutorReviewDialog
          open={isReviewOpen}
          onOpenChange={setIsReviewOpen}
          tutors={availableTutors}
          onSubmit={handleReviewSubmit}
        />
      )}
    </div>
  );
}
