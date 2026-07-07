import type { SupabaseClient } from "@supabase/supabase-js";

interface BadgeDef {
  badge_name: string;
  badge_description: string;
  icon_name: string;
}

const BADGE_CATALOG: Record<string, BadgeDef> = {
  night_owl: {
    badge_name: "Night Owl",
    badge_description: "Studied after 10 PM",
    icon_name: "Night Owl",
  },
  quiz_master: {
    badge_name: "Quiz Master",
    badge_description: "Scored 100% on a quiz",
    icon_name: "Quiz Master",
  },
  week_warrior: {
    badge_name: "Week Warrior",
    badge_description: "Maintained a 7-day study streak",
    icon_name: "Tutor Star",
  },
};

export async function tryUnlockBadge(
  supabase: SupabaseClient,
  userId: string,
  badgeKey: keyof typeof BADGE_CATALOG,
) {
  const badge = BADGE_CATALOG[badgeKey];
  if (!badge) return;

  const { data: existing } = await supabase
    .from("user_badges")
    .select("id")
    .eq("user_id", userId)
    .eq("badge_name", badge.badge_name)
    .maybeSingle();

  if (existing) return;

  await supabase.from("user_badges").insert({
    user_id: userId,
    badge_name: badge.badge_name,
    badge_description: badge.badge_description,
    icon_name: badge.icon_name,
  });
}
