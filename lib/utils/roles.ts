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
  membership_classification?: string | null;
};

export const USER_ROLES = [
  "learner",
  "tutor",
  "assistant_committee_head",
  "committee_head",
  "auditor",
  "treasurer",
  "secretary",
  "vice_president",
  "president",
  "administrator",
  "super_admin",
] as const satisfies readonly UserRole[];

export const ROLE_LABELS: Record<UserRole, string> = {
  learner: "Learner",
  tutor: "Tutor",
  assistant_committee_head: "Asst. Committee Head",
  committee_head: "Committee Head",
  auditor: "Auditor",
  treasurer: "Treasurer",
  secretary: "Secretary",
  vice_president: "Vice President",
  president: "President",
  administrator: "Administrator",
  super_admin: "Super Admin",
};

export const ADMIN_ROLES = ["administrator", "super_admin"] as const;

export const EXECUTIVE_ROLES = [
  "president",
  "vice_president",
  "secretary",
  "treasurer",
  "auditor",
] as const satisfies readonly UserRole[];

export const COMMITTEE_LEADERSHIP = [
  "committee_head",
  "assistant_committee_head",
] as const satisfies readonly UserRole[];

export const MEMBER_ROLES = [
  ...EXECUTIVE_ROLES,
  ...COMMITTEE_LEADERSHIP,
  "tutor",
] as const satisfies readonly UserRole[];

export const TUTOR_ROLES = [
  ...MEMBER_ROLES,
  "super_admin",
] as const satisfies readonly UserRole[];

export const GOVERNANCE_ROLES = [
  "president",
  "administrator",
  "super_admin",
] as const satisfies readonly UserRole[];

export const OFFICER_ROLES = [
  ...EXECUTIVE_ROLES,
  ...COMMITTEE_LEADERSHIP,
  "administrator",
  "super_admin",
] as const satisfies readonly UserRole[];

export const FINANCE_VIEW_ROLES = [
  "treasurer",
  "auditor",
  "president",
  "administrator",
  "super_admin",
] as const satisfies readonly UserRole[];

export const FINANCE_SUBMIT_ROLES = [
  "treasurer",
  "president",
  "administrator",
  "super_admin",
] as const satisfies readonly UserRole[];

export const FINANCE_REVIEW_ROLES = [
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
  ...MEMBER_ROLES,
  "administrator",
  "super_admin",
] as const satisfies readonly UserRole[];

const ADMIN_ROUTE_ACCESS: Array<{
  prefix: string;
  roles: readonly UserRole[];
}> = [
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

export function isEsasScholar(
  profile: ProfileLike | null | undefined,
): boolean {
  return profile?.membership_classification === "esas_scholar";
}

export function isRegularMember(
  profile: ProfileLike | null | undefined,
): boolean {
  return profile?.membership_classification === "regular_member";
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
  roleName: UserRole,
  pathname: string,
): boolean {
  if (hasAnyRole(roleName, ["administrator", "super_admin"])) return true;

  const match = ADMIN_ROUTE_ACCESS.find((route) =>
    pathname.startsWith(route.prefix),
  );
  if (!match) return false;

  return hasAnyRole(roleName, match.roles);
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
