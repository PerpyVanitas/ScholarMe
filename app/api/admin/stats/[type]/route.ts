import { createAdminClient } from "@/lib/supabase/create-client"
import { NextResponse } from "next/server"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params
  const supabase = await createAdminClient()

  try {
    if (type === "users") {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url, created_at, roles(name)")
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) throw error
      return NextResponse.json(data || [])
    }

    if (type === "tutors") {
      const { data, error } = await supabase
        .from("tutors")
        .select("id, user_id, rating, total_ratings, created_at, profiles(id, full_name, email, avatar_url), tutor_specializations(specializations(name))")
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) throw error
      return NextResponse.json(data || [])
    }

    if (type === "sessions") {
      const { data, error } = await supabase
        .from("sessions")
        .select("id, scheduled_date, start_time, end_time, status, notes, tutors(profiles(full_name)), learner_profile:profiles!sessions_learner_id_fkey(full_name), specializations(name)")
        .order("scheduled_date", { ascending: false })
        .limit(50)

      if (error) throw error
      return NextResponse.json(data || [])
    }

    if (type === "pending") {
      const { data, error } = await supabase
        .from("sessions")
        .select("id, scheduled_date, start_time, end_time, status, notes, tutors(profiles(full_name)), learner_profile:profiles!sessions_learner_id_fkey(full_name), specializations(name)")
        .eq("status", "pending")
        .order("scheduled_date", { ascending: false })
        .limit(50)

      if (error) throw error
      return NextResponse.json(data || [])
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  } catch (err) {
    console.error("[admin-stats]", err)
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 })
  }
}
