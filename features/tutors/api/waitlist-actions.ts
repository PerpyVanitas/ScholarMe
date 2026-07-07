"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function joinWaitlist(tutorId: string, date: string) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Unauthorized");

  const { error } = await supabase.from("session_waitlists").insert({
    tutor_id: tutorId,
    learner_id: user.user.id,
    requested_date: date,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/tutors/${tutorId}`);
  return { success: true };
}

export async function getTutorWaitlist(tutorId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("session_waitlists")
    .select("*, learner:profiles(*)")
    .eq("tutor_id", tutorId)
    .eq("status", "waiting")
    .order("created_at", { ascending: true });

  if (error) return [];
  return data;
}

export async function getMyWaitlists() {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return [];

  const { data, error } = await supabase
    .from("session_waitlists")
    .select("*, tutor:tutors(*, profiles(*))")
    .eq("learner_id", user.user.id)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data;
}
