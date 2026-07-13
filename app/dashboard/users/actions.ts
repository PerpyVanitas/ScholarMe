"use server";

import { createClient } from "@/lib/supabase/server";

export async function searchUsers(query: string) {
  const supabase = await createClient();

  // For security, only authenticated users can search
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Fetch users that are NOT private, or tutors
  let dbQuery = supabase.from("profiles").select(`
      id, 
      full_name, 
      avatar_url, 
      degree_program, 
      membership_classification, 
      status_message,
      is_private,
      roles (name)
    `);

  if (query && query.trim() !== "") {
    // Search by full name or degree program
    dbQuery = dbQuery.or(
      `full_name.ilike.%${query}%,degree_program.ilike.%${query}%`,
    );
  }

  const { data, error } = await dbQuery.limit(50);

  if (error) {
    console.error("Search users error:", error);
    return { success: false, error: error.message };
  }

  // Filter out private profiles in memory (unless they are tutors or we change the policy later)
  const filteredData = data.filter((profile: any) => {
    // Tutors are always visible (assuming role 'tutor')
    const isTutor = profile.roles?.name === "tutor";
    return !profile.is_private || isTutor;
  });

  // Fetch blocked relationships
  const { data: blockedFriends } = await supabase
    .from("friends")
    .select("user_id1, user_id2")
    .eq("status", "blocked")
    .or(`user_id1.eq.${user.id},user_id2.eq.${user.id}`);

  const blockedUserIds = new Set<string>();
  if (blockedFriends) {
    for (const f of blockedFriends) {
      if (f.user_id1 === user.id) blockedUserIds.add(f.user_id2);
      if (f.user_id2 === user.id) blockedUserIds.add(f.user_id1);
    }
  }

  const nonBlockedData = filteredData.filter(
    (profile: any) => !blockedUserIds.has(profile.id),
  );

  return { success: true, data: nonBlockedData };
}
