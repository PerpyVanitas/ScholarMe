"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Announcement } from "@/lib/types";

export async function getAnnouncements(): Promise<Announcement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("announcements")
    .select(
      `
      *,
      profiles:author_id (
        id,
        full_name,
        avatar_url,
        roles:role_id (
          name
        )
      )
    `,
    )
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching announcements:", error);
    return [];
  }

  return (data as any) || [];
}

export async function createAnnouncement(data: {
  title: string;
  content: string;
  priority: boolean;
}) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();

  if (!user.user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase.from("announcements").insert({
    title: data.title,
    content: data.content,
    priority: data.priority,
    author_id: user.user.id,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/home");
  return { success: true };
}

export async function deleteAnnouncement(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("announcements").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/home");
  return { success: true };
}
