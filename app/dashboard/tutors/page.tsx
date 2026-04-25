import { createClient } from "@/lib/supabase/server"
import { TutorsList } from "@/components/tutors/tutors-list"

export default async function TutorsPage() {
  const supabase = await createClient()

  // Fetch data securely on the server
  const [tutorRes, specRes] = await Promise.all([
    supabase
      .from("tutors")
      .select("*, profiles(*), tutor_specializations(specializations(*))")
      .order("rating", { ascending: false }),
    supabase.from("specializations").select("*").order("name"),
  ])

  return (
    <TutorsList
      initialTutors={tutorRes.data || []}
      specializations={specRes.data || []}
    />
  )
}
