"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createTeamTask(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const deliverable = formData.get("deliverable") as string;
  const deadline = formData.get("deadline") as string;
  const assignee_id = formData.get("assignee_id") as string || null;
  const committee_id = formData.get("committee_id") as string || null;

  const { error } = await supabase.from("team_tasks").insert({
    deliverable,
    deadline: deadline || null,
    assignee_id,
    committee_id,
    status: "todo"
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/team");
}

export async function updateTaskStatus(taskId: string, status: "todo" | "in_progress" | "review" | "done") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("team_tasks").update({ status }).eq("id", taskId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/team");
}

export async function addSchedule(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const date = formData.get("date") as string;
  const activity = formData.get("activity") as string;
  
  // Optionally allow assigning for others if manager
  let member_id = formData.get("member_id") as string;
  if (!member_id) {
    member_id = user.id;
  }

  const { error } = await supabase.from("team_schedules").insert({
    member_id,
    date,
    activity
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/team");
}
