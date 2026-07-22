import { describe, it, expect } from "vitest";

export interface StudyGroupMember {
  id: string;
  user_id: string;
  group_id: string;
  role: "owner" | "admin" | "member";
  status: "registered" | "waitlisted";
  created_at: string;
}

export interface StudyGroup {
  id: string;
  name: string;
  created_by: string;
  max_participants: number;
  max_waitlist_cap: number;
  members: StudyGroupMember[];
}

/** Check if user can join group directly as registered participant */
export function canJoinAsParticipant(group: StudyGroup): boolean {
  const activeCount = group.members.filter((m) => m.status === "registered").length;
  return activeCount < group.max_participants;
}

/** Join study group (as registered or waitlisted), enforcing waitlist cap */
export function joinStudyGroup(group: StudyGroup, userId: string): StudyGroupMember {
  const activeCount = group.members.filter((m) => m.status === "registered").length;
  const waitlistCount = group.members.filter((m) => m.status === "waitlisted").length;

  if (activeCount < group.max_participants) {
    const member: StudyGroupMember = {
      id: `m-${Date.now()}-${Math.random()}`,
      user_id: userId,
      group_id: group.id,
      role: "member",
      status: "registered",
      created_at: new Date().toISOString(),
    };
    group.members.push(member);
    return member;
  }

  if (waitlistCount >= group.max_waitlist_cap) {
    throw new Error("Study group and waitlist are both at full capacity");
  }

  const member: StudyGroupMember = {
    id: `m-${Date.now()}-${Math.random()}`,
    user_id: userId,
    group_id: group.id,
    role: "member",
    status: "waitlisted",
    created_at: new Date().toISOString(),
  };
  group.members.push(member);
  return member;
}

/** Leave or cancel participation in study group, auto-promoting top waitlisted user if available */
export function leaveStudyGroup(group: StudyGroup, userId: string): StudyGroupMember | null {
  const index = group.members.findIndex((m) => m.user_id === userId);
  if (index === -1) return null;

  const [removed] = group.members.splice(index, 1);

  if (removed.status === "registered") {
    // Find top waitlist entry ordered by created_at
    const topWaitlisted = group.members
      .filter((m) => m.status === "waitlisted")
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];

    if (topWaitlisted) {
      topWaitlisted.status = "registered";
      return topWaitlisted;
    }
  }

  return null;
}

/** Reassign host when creator account is deleted */
export function handleHostDeletion(group: StudyGroup, deletedUserId: string): string | null {
  if (group.created_by !== deletedUserId) return group.created_by;

  // Remove deleted host from member list
  group.members = group.members.filter((m) => m.user_id !== deletedUserId);

  if (group.members.length === 0) {
    return null; // Group has no remaining members
  }

  // Sort remaining active members by created_at (oldest member becomes new host)
  const nextHost = group.members.sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )[0];

  nextHost.role = "owner";
  group.created_by = nextHost.user_id;
  return nextHost.user_id;
}

describe("Features: Study Groups", () => {
  it("1. Capacity logic — user cannot join directly when current_participants >= max_participants", () => {
    const group: StudyGroup = {
      id: "g1",
      name: "Calculus III Prep",
      created_by: "u-owner",
      max_participants: 2,
      max_waitlist_cap: 5,
      members: [
        { id: "m1", user_id: "u1", group_id: "g1", role: "owner", status: "registered", created_at: "2026-01-01T00:00:00Z" },
        { id: "m2", user_id: "u2", group_id: "g1", role: "member", status: "registered", created_at: "2026-01-01T00:05:00Z" },
      ],
    };

    expect(canJoinAsParticipant(group)).toBe(false);

    // Attempting to join adds user to waitlist
    const newMember = joinStudyGroup(group, "u3");
    expect(newMember.status).toBe("waitlisted");
    expect(group.members.length).toBe(3);
  });

  it("2. Waitlist auto-promotion — top waitlisted entry is promoted when active member leaves", () => {
    const group: StudyGroup = {
      id: "g2",
      name: "Physics I Problem Solving",
      created_by: "u-host",
      max_participants: 2,
      max_waitlist_cap: 5,
      members: [
        { id: "m1", user_id: "u1", group_id: "g2", role: "owner", status: "registered", created_at: "2026-01-01T00:00:00Z" },
        { id: "m2", user_id: "u2", group_id: "g2", role: "member", status: "registered", created_at: "2026-01-01T00:05:00Z" },
        { id: "m3", user_id: "u3-top", group_id: "g2", role: "member", status: "waitlisted", created_at: "2026-01-01T00:10:00Z" },
        { id: "m4", user_id: "u4-next", group_id: "g2", role: "member", status: "waitlisted", created_at: "2026-01-01T00:15:00Z" },
      ],
    };

    const promoted = leaveStudyGroup(group, "u2");
    expect(promoted).not.toBeNull();
    expect(promoted?.user_id).toBe("u3-top");
    expect(promoted?.status).toBe("registered");

    const activeCount = group.members.filter((m) => m.status === "registered").length;
    expect(activeCount).toBe(2);
  });

  it("3. Waitlist cap enforcement — rejects join attempt when group and waitlist are both full", () => {
    const group: StudyGroup = {
      id: "g3",
      name: "Data Structures & Algorithms",
      created_by: "u-host",
      max_participants: 5,
      max_waitlist_cap: 10,
      members: [],
    };

    // Fill 5 active registered slots + 10 waitlisted slots (total 15 users)
    for (let i = 1; i <= 15; i++) {
      joinStudyGroup(group, `user-${i}`);
    }

    expect(group.members.filter((m) => m.status === "registered").length).toBe(5);
    expect(group.members.filter((m) => m.status === "waitlisted").length).toBe(10);

    // 16th user attempt must fail
    expect(() => joinStudyGroup(group, "user-16")).toThrow(
      "Study group and waitlist are both at full capacity"
    );
  });

  it("4. Host auto-reassignment — reassigns host role to next-oldest member when host account is removed", () => {
    const group: StudyGroup = {
      id: "g4",
      name: "Organic Chemistry II",
      created_by: "u-original-host",
      max_participants: 10,
      max_waitlist_cap: 10,
      members: [
        { id: "m1", user_id: "u-original-host", group_id: "g4", role: "owner", status: "registered", created_at: "2026-01-01T00:00:00Z" },
        { id: "m2", user_id: "u-oldest-member", group_id: "g4", role: "member", status: "registered", created_at: "2026-01-01T01:00:00Z" },
        { id: "m3", user_id: "u-newer-member", group_id: "g4", role: "member", status: "registered", created_at: "2026-01-01T02:00:00Z" },
      ],
    };

    const newHostId = handleHostDeletion(group, "u-original-host");
    expect(newHostId).toBe("u-oldest-member");
    expect(group.created_by).toBe("u-oldest-member");
    expect(group.members.find((m) => m.user_id === "u-oldest-member")?.role).toBe("owner");
    expect(group.members.some((m) => m.user_id === "u-original-host")).toBe(false);
  });
});
