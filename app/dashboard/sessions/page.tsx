import { createClient } from "@/lib/supabase/server"
import { SessionsClient } from "@/components/sessions/sessions-client"
import { redirect } from "next/navigation"
import type { UserRole } from "@/lib/types"

export default async function SessionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }

  // Get User Role
  const { data: profile } = await supabase
    .from("profiles")
    .select("roles(name)")
    .eq("id", user.id)
    .single()
    
  const userRole = (profile?.roles?.name || "learner") as UserRole

  let query
  if (userRole === "tutor") {
    // For tutor, find their tutor record first
    const { data: tutor } = await supabase
      .from("tutors")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle()

    const tutorId = tutor?.id
    if (!tutorId) {
      return <SessionsClient initialSessions={[]} role={userRole} />
    }

    query = supabase
      .from("sessions")
      .select("*, specializations(*), session_ratings(*)")
      .eq("tutor_id", tutorId)
      .order("scheduled_date", { ascending: false })
  } else {
    query = supabase
      .from("sessions")
      .select("*, tutors(*, profiles(*)), specializations(*), session_ratings(*)")
      .eq("learner_id", user.id)
      .order("scheduled_date", { ascending: false })
  }

  const { data: sessions } = await query

  return (
    <SessionsClient initialSessions={sessions || []} role={userRole} />
  )
}
