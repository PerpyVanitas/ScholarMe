import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TutorReviewsClient } from "./client";
import { getRoleName, hasAnyRole, ADMIN_ROLES } from "@/lib/utils/roles";
import { ensureTutorRow } from "@/features/tutors/api/db";

export default async function TutorReviewsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin");
  }

  // Get current user's profile and tutor status
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, roles(name), tutors(*)")
    .eq("id", user.id)
    .single();

  const roleName = getRoleName(profile as unknown as Parameters<typeof getRoleName>[0]);
  const isAdmin = hasAnyRole(roleName, ADMIN_ROLES);

  // Auto-provision tutor row for super_admin so they can diagnose the page
   
  if ((!profile?.tutors || (profile.tutors as unknown[]).length === 0) && isAdmin) {
    await ensureTutorRow(supabase, user);
    // Re-fetch after provisioning
    const { data: refreshed } = await supabase
      .from("profiles")
      .select("*, roles(name), tutors(*)")
      .eq("id", user.id)
      .single();
    if (refreshed) Object.assign(profile as object, refreshed);
  }

   
  if (!profile || !profile.tutors || (profile.tutors as unknown[]).length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        You must be a tutor to view this page.
      </div>
    );
  }

   
  const currentTutor = (profile.tutors as unknown[])[0];
  // @ts-expect-error: Strict unknown type check
  const isLead = currentTutor.is_lead_tutor || isAdmin || false;

  // Fetch reviews based on role
   
  let reviews: Array<{
    id: string;
    tutor?: { profiles?: { full_name?: string } };
    reviewer?: { profiles?: { full_name?: string } };
    rating: number;
    created_at: string;
    feedback: string;
  }> = [];
  if (isLead) {
    // Lead tutors / admins see reviews they wrote
    const { data: myReviews } = await supabase
      .from("tutor_reviews")
      .select("*, tutor:tutors(*, profiles(*))")
      // @ts-expect-error: Strict unknown type check
      .eq("reviewer_id", currentTutor.id)
      .order("created_at", { ascending: false });
    if (myReviews) reviews = myReviews;
  } else {
    // Regular tutors see reviews written about them
    const { data: myReviews } = await supabase
      .from("tutor_reviews")
      .select("*, reviewer:tutors(*, profiles(*))")
      // @ts-expect-error: Strict unknown type check
      .eq("tutor_id", currentTutor.id)
      .order("created_at", { ascending: false });
    if (myReviews) reviews = myReviews;
  }

  // If lead/admin, fetch all other active tutors to review
   
  let availableTutors: Array<{ id: string; profiles?: { full_name: string } | null; }> = [];
  if (isLead) {
    const { data: tutors } = await supabase
      .from("tutors")
      .select("*, profiles(*)")
      // @ts-expect-error: Strict unknown type check
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
        // @ts-expect-error: Strict unknown type check
        currentTutor={currentTutor}
        isLead={isLead}
        reviews={reviews}
        availableTutors={availableTutors}
      />
    </div>
  );
}
