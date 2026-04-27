/**
 * Shared role normalization utilities.
 *
 * Supabase returns joined `roles(id, name)` relations as arrays even when
 * there is only one row. These helpers handle both the array shape (from DB)
 * and the single-object shape (used in inline profile constructions).
 */

import type { Role, Profile, UserRole } from "@/lib/types"

export function normalizeRole(raw: Role | Role[] | undefined | null): Role | undefined {
  if (!raw) return undefined
  if (Array.isArray(raw)) return (raw[0] as Role) ?? undefined
  return raw
}

export function getRoleName(profile: Pick<Profile, "roles">): UserRole {
  const role = normalizeRole(profile.roles as Role | Role[] | undefined)
  return (role?.name ?? "learner") as UserRole
}
