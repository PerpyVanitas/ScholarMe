"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateProfile(data: {
  firstName: string
  lastName: string
  birthdate: string | null
  avatarPathname: string | null
  membershipNumber: string | null
  selectedSpecs: string[]
}) {
  const supabase = await createClient()

  // Securely get the user from the session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("Unauthorized")
  }

  // Fetch the actual role securely
  const { data: profile } = await supabase
    .from("profiles")
    .select("roles(name)")
    .eq("id", user.id)
    .single()

  const roleName = Array.isArray(profile?.roles) ? profile.roles[0]?.name : (profile?.roles as any)?.name
  const isTutor = roleName === "tutor"

  // Update profile
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      first_name: data.firstName.trim(),
      last_name: data.lastName.trim(),
      full_name: `${data.firstName.trim()} ${data.lastName.trim()}`,
      birthdate: data.birthdate || null,
      avatar_url: data.avatarPathname || null,
      membership_number: isTutor ? (data.membershipNumber?.trim() || null) : null,
      profile_completed: true,
    })
    .eq("id", user.id)

  if (profileError) throw profileError

  // If the server confirms this user is a tutor, handle tutor-specific tables
  if (isTutor) {
    let { data: tutorRow } = await supabase
      .from("tutors")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle()

    if (!tutorRow) {
      const { data: newTutor } = await supabase
        .from("tutors")
        .insert({ profile_id: user.id })
        .select("id")
        .single()
      tutorRow = newTutor
    }

    if (tutorRow) {
      // Clear existing specializations
      await supabase
        .from("tutor_specializations")
        .delete()
        .eq("tutor_id", tutorRow.id)

      // Insert new ones securely
      if (data.selectedSpecs && data.selectedSpecs.length > 0) {
        await supabase
          .from("tutor_specializations")
          .insert(
            data.selectedSpecs.map(specId => ({
              tutor_id: tutorRow!.id,
              specialization_id: specId,
            }))
          )
      }
    }
  }

  revalidatePath("/dashboard")
  return { success: true }
}
