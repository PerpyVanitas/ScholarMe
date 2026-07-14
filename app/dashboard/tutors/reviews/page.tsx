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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const roleName = getRoleName(profile as any);
  const isAdmin = hasAnyRole(roleName, ADMIN_ROLES);

  // Auto-provision tutor row for super_admin so they can diagnose the page
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((!profile?.tutors || (profile.tutors as any[]).length === 0) && isAdmin) {
    await ensureTutorRow(supabase, user);
    // Re-fetch after provisioning
    const { data: refreshed } = await supabase
      .from("profiles")
      .select("*, roles(name), tutors(*)")
      .eq("id", user.id)
      .single();
    if (refreshed) Object.assign(profile as object, refreshed);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!profile || !profile.tutors || (profile.tutors as any[]).length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        You must be a tutor to view this page.
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentTutor = (profile.tutors as any[])[0];
  const isLead = currentTutor.is_lead_tutor || isAdmin || false;

  // Fetch reviews based on role
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let reviews: any[] = [];
  if (isLead) {
    // Lead tutors / admins see reviews they wrote
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

  // If lead/admin, fetch all other active tutors to review
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let availableTutors: any[] = [];
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
