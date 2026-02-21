/** Demo mode config -- maps dev roles to seeded user data for unauthenticated previews. */

import type { UserRole } from "@/lib/types"

export const DEMO_USERS = {
  learner: {
    profileId: "d1000000-0000-0000-0000-000000000001",
    fullName: "Alex Johnson",
    email: "alex.johnson@example.com",
  },
  tutor: {
    profileId: "c1000000-0000-0000-0000-000000000001",
    tutorId: "e1000000-0000-0000-0000-000000000001",
    fullName: "Dr. Sarah Chen",
    email: "sarah.chen@example.com",
  },
  administrator: {
    profileId: "b1000000-0000-0000-0000-000000000001",
    fullName: "Admin User",
    email: "admin@scholarme.org",
  },
} as const

export type DemoRole = keyof typeof DEMO_USERS

export function getDemoProfileId(role: string): string {
  return DEMO_USERS[role as DemoRole]?.profileId ?? DEMO_USERS.administrator.profileId
}

export function getDemoTutorId(role: string): string | null {
  return role === "tutor" ? DEMO_USERS.tutor.tutorId : null
}

/** Read the dev_role cookie and return the matching demo user ID + role. */
export function getDemoUserFromCookie(fallbackRole: UserRole = "learner"): {
  userId: string
  role: UserRole
} {
  const cookie =
    typeof document !== "undefined"
      ? document.cookie
          .split("; ")
          .find((c) => c.startsWith("dev_role="))
          ?.split("=")[1]
      : undefined
  const role = (cookie as UserRole) || fallbackRole
  const userId = DEMO_USERS[role as DemoRole]?.profileId ?? DEMO_USERS[fallbackRole as DemoRole].profileId
  return { userId, role }
}
