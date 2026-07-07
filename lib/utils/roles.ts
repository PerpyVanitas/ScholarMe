/**
 * Shared role normalization utilities.
 *
 * Supabase returns joined `roles(id, name)` relations as arrays even when
 * there is only one row. These helpers handle both the array shape (from DB)
 * and the single-object shape (used in inline profile constructions).
 */

import type { Role, Profile, UserRole } from "@/lib/types";

type RoleLike = {
  id?: string;
  name?: string | null;
};

type ProfileLike = {
  roles?: RoleLike | RoleLike[] | null;
};

export const USER_ROLES = [
  "learner",
  "tutor",
  "officer",
  "committee_head",
  "finance_manager",
  "treasurer",
  "auditor",
  "president",
  "faculty_adviser",
  "administrator",
  "super_admin",
] as const satisfies readonly UserRole[];

export const ROLE_LABELS: Record<UserRole, string> = {
  learner: "Learner",
  tutor: "Tutor",
  officer: "Officer",
  committee_head: "Committee Head",
  finance_manager: "Finance Manager",
  treasurer: "Treasurer",
  auditor: "Auditor",
  president: "President",
  faculty_adviser: "Faculty Adviser",
  administrator: "Administrator",
  super_admin: "Super Admin",
};

export const ADMIN_ROLES = ["administrator", "super_admin"] as const;
export const GOVERNANCE_ROLES = [
  "president",
  "faculty_adviser",
  "administrator",
  "super_admin",
] as const satisfies readonly UserRole[];
export const OFFICER_ROLES = [
  "officer",
  "committee_head",
  "finance_manager",
  "treasurer",
  "auditor",
  "president",
  "faculty_adviser",
  "administrator",
  "super_admin",
] as const satisfies readonly UserRole[];
export const FINANCE_VIEW_ROLES = [
  "committee_head",
  "finance_manager",
  "treasurer",
  "auditor",
  "president",
  "faculty_adviser",
  "administrator",
  "super_admin",
] as const satisfies readonly UserRole[];
export const FINANCE_SUBMIT_ROLES = [
  "committee_head",
  "finance_manager",
  "treasurer",
  "president",
  "administrator",
  "super_admin",
] as const satisfies readonly UserRole[];
export const FINANCE_REVIEW_ROLES = [
  "finance_manager",
  "treasurer",
  "administrator",
  "super_admin",
] as const satisfies readonly UserRole[];
export const PRESIDENT_APPROVAL_ROLES = [
  "president",
  "administrator",
  "super_admin",
] as const satisfies readonly UserRole[];
export const AUDIT_ROLES = [
  "auditor",
  "administrator",
  "super_admin",
] as const satisfies readonly UserRole[];
export const TEAMWORK_ROLES = [
  "officer",
  "committee_head",
  "finance_manager",
  "treasurer",
  "auditor",
  "president",
  "administrator",
  "super_admin",
] as const satisfies readonly UserRole[];

const ADMIN_ROUTE_ACCESS: Array<{
  prefix: string;
  roles: readonly UserRole[];
}> = [
  { prefix: "/dashboard/admin/roles", roles: ["super_admin"] },
  { prefix: "/dashboard/admin/messages", roles: ["super_admin"] },
  { prefix: "/dashboard/admin/feedback", roles: ["super_admin"] },
  { prefix: "/dashboard/admin/reports", roles: FINANCE_VIEW_ROLES },
  { prefix: "/dashboard/admin/timesheets", roles: GOVERNANCE_ROLES },
  { prefix: "/dashboard/admin/sessions", roles: GOVERNANCE_ROLES },
  { prefix: "/dashboard/admin/tutor-stats", roles: GOVERNANCE_ROLES },
  { prefix: "/dashboard/admin/verifications", roles: GOVERNANCE_ROLES },
  { prefix: "/dashboard/admin/export", roles: GOVERNANCE_ROLES },
  { prefix: "/dashboard/admin/health", roles: GOVERNANCE_ROLES },
  { prefix: "/dashboard/admin/logs", roles: GOVERNANCE_ROLES },
  { prefix: "/dashboard/admin/scanner", roles: GOVERNANCE_ROLES },
  { prefix: "/dashboard/admin/users", roles: GOVERNANCE_ROLES },
  { prefix: "/dashboard/admin", roles: GOVERNANCE_ROLES },
];

export function isKnownRole(role: string | null | undefined): role is UserRole {
  return USER_ROLES.includes(role as UserRole);
}

export function hasAnyRole(
  role: string | null | undefined,
  allowedRoles: readonly UserRole[],
): role is UserRole {
  return isKnownRole(role) && allowedRoles.includes(role);
}

export function isAdminRole(
  role: string | null | undefined,
): role is (typeof ADMIN_ROLES)[number] {
  return ADMIN_ROLES.includes(role as (typeof ADMIN_ROLES)[number]);
}

export function normalizeRole(
  raw: Role | RoleLike | Role[] | RoleLike[] | undefined | null,
): RoleLike | undefined {
  if (!raw) return undefined;
  if (Array.isArray(raw)) return (raw[0] as RoleLike) ?? undefined;
  return raw;
}

export function getRoleName(
  profile: Pick<Profile, "roles"> | ProfileLike,
): UserRole {
  const role = normalizeRole(
    profile.roles as Role | RoleLike | Role[] | RoleLike[] | undefined,
  );
  return isKnownRole(role?.name) ? role.name : "learner";
}

export function canAccessAdminRoute(
  role: string | null | undefined,
  pathname: string,
) {
  const match = ADMIN_ROUTE_ACCESS.find((route) =>
    pathname.startsWith(route.prefix),
  );
  return !!match && hasAnyRole(role, match.roles);
}

export function canAccessFinance(role: string | null | undefined) {
  return hasAnyRole(role, FINANCE_VIEW_ROLES);
}

export function canSubmitFinance(role: string | null | undefined) {
  return hasAnyRole(role, FINANCE_SUBMIT_ROLES);
}

export function canReviewFinance(role: string | null | undefined) {
  return hasAnyRole(role, FINANCE_REVIEW_ROLES);
}

export function canApproveFinance(role: string | null | undefined) {
  return hasAnyRole(role, PRESIDENT_APPROVAL_ROLES);
}

export function canAuditFinance(role: string | null | undefined) {
  return hasAnyRole(role, AUDIT_ROLES);
}
