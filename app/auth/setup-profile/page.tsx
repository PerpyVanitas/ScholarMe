import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SetupProfileForm } from "./setup-profile-form"

export default async function SetupProfilePage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Get profile with role
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, roles(*)")
    .eq("id", user.id)
    .single()

  if (profile?.profile_completed) {
    redirect("/dashboard")
  }

  // Load specializations for tutors
  const { data: specializations } = await supabase
    .from("specializations")
    .select("id, name")
    .order("name")

  // Load existing tutor specializations if tutor
  let initialSelectedSpecs: string[] = []
  if (profile?.roles?.name === "tutor") {
    const { data: tutorRow } = await supabase
      .from("tutors")
      .select("id")
      .eq("profile_id", user.id)
      .single()

    if (tutorRow) {
      const { data: tutorSpecs } = await supabase
        .from("tutor_specializations")
        .select("specialization_id")
        .eq("tutor_id", tutorRow.id)
      
      if (tutorSpecs) {
        initialSelectedSpecs = tutorSpecs.map((s: any) => s.specialization_id)
      }
    }
  }

  return (
    <SetupProfileForm
      userId={user.id}
      initialRoleName={profile?.roles?.name || "learner"}
      initialFirstName={profile?.first_name || ""}
      initialLastName={profile?.last_name || ""}
      initialBirthdate={profile?.birthdate || ""}
      initialMembershipNumber={profile?.membership_number || ""}
      initialAvatarUrl={profile?.avatar_url || null}
      specializations={specializations || []}
      initialSelectedSpecs={initialSelectedSpecs}
    />
  )
}
