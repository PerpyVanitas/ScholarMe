import type { SupabaseClient, User } from "@supabase/supabase-js"

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

function roleNameFromUser(user: User): string {
  if (
    user.user_metadata?.role_name === "administrator" ||
    user.user_metadata?.role === "administrator"
  ) {
    return "administrator"
  }
  if (user.user_metadata?.role_name === "tutor" || user.user_metadata?.role === "tutor") {
    return "tutor"
  }
  return "learner"
}

/** Ensure a profiles row exists for the auth user (required before update/avatar). */
export async function ensureProfileRow(
  supabase: SupabaseClient,
  user: User
): Promise<{ ok: true; role_id: string } | { ok: false; error: string }> {
  const { data: existing, error: fetchError } = await supabase
    .from("profiles")
    .select("id, role_id")
    .eq("id", user.id)
    .maybeSingle()

  if (fetchError) {
    return { ok: false, error: fetchError.message }
  }

  if (existing?.id && existing.role_id) {
    return { ok: true, role_id: existing.role_id }
  }

  const roleId = existing?.role_id ?? (await resolveRoleId(supabase, roleNameFromUser(user)))
  const fullNameStr =
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split("@")[0] ||
    "User"
  let firstName = (user.user_metadata?.first_name as string | undefined) || ""
  let lastName = (user.user_metadata?.last_name as string | undefined) || ""
  if (!firstName && !lastName) {
    const parts = fullNameStr.trim().split(/\s+/)
    firstName = parts[0] || ""
    lastName = parts.slice(1).join(" ") || ""
  }

  if (existing?.id) {
    const { error: patchError } = await supabase
      .from("profiles")
      .update({ role_id: roleId, email: user.email || "" })
      .eq("id", user.id)
    if (patchError) return { ok: false, error: patchError.message }
    return { ok: true, role_id: roleId }
  }

  const { error: insertError } = await supabase.from("profiles").insert({
    id: user.id,
    email: user.email || "",
    full_name: fullNameStr,
    first_name: firstName || null,
    last_name: lastName || null,
    role_id: roleId,
    profile_completed: false,
  })

  if (insertError) {
    if (insertError.code === "23505") {
      const { data: retry, error: retryError } = await supabase
        .from("profiles")
        .select("role_id")
        .eq("id", user.id)
        .maybeSingle()
      if (!retryError && retry?.role_id) {
        return { ok: true, role_id: retry.role_id }
      }
    }
    return { ok: false, error: insertError.message }
  }

  return { ok: true, role_id: roleId }
}
