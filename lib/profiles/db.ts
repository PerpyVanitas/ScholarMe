import type { SupabaseClient } from "@supabase/supabase-js"

export const PROFILE_WITH_ROLE_SELECT = "*, roles(name)" as const

/** Keep birthdate and date_of_birth in sync (schema has both). */
export function birthdateFields(isoDate: string | null | undefined) {
  if (!isoDate) {
    return { birthdate: null, date_of_birth: null }
  }
  const day = isoDate.includes("T") ? isoDate.split("T")[0] : isoDate
  return { birthdate: day, date_of_birth: day }
}

/** Resolve roles.id; never returns null (falls back to learner). */
export async function resolveRoleId(
  supabase: SupabaseClient,
  roleName: string
): Promise<string> {
  const allowed = ["learner", "tutor", "administrator"] as const
  const safeName = allowed.includes(roleName as (typeof allowed)[number])
    ? roleName
    : "learner"

  const { data: roleRow } = await supabase
    .from("roles")
    .select("id")
    .eq("name", safeName)
    .maybeSingle()

  if (roleRow?.id) return roleRow.id

  const { data: learnerRow } = await supabase
    .from("roles")
    .select("id")
    .eq("name", "learner")
    .maybeSingle()

  if (!learnerRow?.id) {
    throw new Error("Default learner role not found in database")
  }
  return learnerRow.id
}
