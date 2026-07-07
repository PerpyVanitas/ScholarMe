import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TutorReviewsClient } from "./client";

export default async function TutorReviewsPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Get current user's profile and tutor status
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, tutors(*)")
    .eq("id", session.user.id)
    .single();

  if (!profile || !profile.tutors || profile.tutors.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        You must be a tutor to view this page.
      </div>
    );
  }

  const currentTutor = profile.tutors[0];
  const isLead = currentTutor.is_lead_tutor || false;

  // Fetch reviews based on role
  let reviews = [];
  if (isLead) {
    // Lead tutors see reviews they wrote
    const { data: myReviews } = await supabase
      .from("tutor_reviews")
      .select("*, tutor:tutors(*, profiles(*))")
      .eq("reviewer_id", currentTutor.id)
      .order("created_at", { ascending: false });
    if (myReviews) reviews = myReviews;
  } else {
    // Regular tutors see reviews written about them
    const { data: myReviews } = await supabase
      .from("tutor_reviews")
      .select("*, reviewer:tutors(*, profiles(*))")
      .eq("tutor_id", currentTutor.id)
      .order("created_at", { ascending: false });
    if (myReviews) reviews = myReviews;
  }

  // If lead, fetch all other active tutors to review
  let availableTutors = [];
  if (isLead) {
    const { data: tutors } = await supabase
      .from("tutors")
      .select("*, profiles(*)")
      .neq("id", currentTutor.id)
      .eq("is_available", true);
    if (tutors) availableTutors = tutors;
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Peer Reviews & Mentorship
        </h1>
        <p className="text-muted-foreground">
          {isLead
            ? "Submit performance evaluations for junior tutors."
            : "View feedback and ratings submitted by your lead tutors."}
        </p>
      </div>

      <TutorReviewsClient
        currentTutor={currentTutor}
        isLead={isLead}
        reviews={reviews}
        availableTutors={availableTutors}
      />
    </div>
  );
}
