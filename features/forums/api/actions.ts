"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createForumPost(data: {
  title: string;
  content: string;
  category?: string;
}) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Unauthorized");

  const { error } = await supabase.from("forum_posts").insert({
    author_id: user.user.id,
    title: data.title.trim(),
    content: data.content.trim(),
    category: data.category?.trim() || "General",
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/forums");
}

export async function createForumReply(postId: string, content: string) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Unauthorized");

  const { error } = await supabase.from("forum_replies").insert({
    post_id: postId,
    author_id: user.user.id,
    content: content.trim(),
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/forums/${postId}`);
}
