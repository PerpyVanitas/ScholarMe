"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createStudyGroup(data: {
  name: string;
  description?: string;
  is_public?: boolean;
}) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Unauthorized");

  const { data: group, error } = await supabase
    .from("study_groups")
    .insert({
      name: data.name.trim(),
      description: data.description?.trim() || null,
      is_public: data.is_public ?? true,
      created_by: user.user.id,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await supabase.from("study_group_members").insert({
    group_id: group.id,
    user_id: user.user.id,
    role: "owner",
  });

  revalidatePath("/dashboard/groups");
  return group.id;
}
