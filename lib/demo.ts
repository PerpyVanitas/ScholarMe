/**
 * Demo mode configuration - maps dev roles to seeded user data.
 * Used when there's no authenticated Supabase user.
 */

export const DEMO_USERS = {
  learner: {
    profileId: "d1000000-0000-0000-0000-000000000001",  // Alex Johnson
    fullName: "Alex Johnson",
    email: "alex.johnson@example.com",
  },
  tutor: {
    profileId: "c1000000-0000-0000-0000-000000000001",  // Dr. Sarah Chen
    tutorId: "e1000000-0000-0000-0000-000000000001",
    fullName: "Dr. Sarah Chen",
    email: "sarah.chen@example.com",
  },
  administrator: {
    profileId: "b1000000-0000-0000-0000-000000000001",  // Admin User
    fullName: "Admin User",
    email: "admin@scholarme.org",
  },
} as const;

export type DemoRole = keyof typeof DEMO_USERS;

export function getDemoProfileId(role: string): string {
  return DEMO_USERS[role as DemoRole]?.profileId || DEMO_USERS.administrator.profileId;
}

export function getDemoTutorId(role: string): string | null {
  if (role === "tutor") return DEMO_USERS.tutor.tutorId;
  return null;
}
