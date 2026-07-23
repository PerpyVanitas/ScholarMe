import { describe, it, expect, vi, beforeEach } from "vitest";

// Pure helper function simulating mentorship pool matching logic
export interface Profile {
  id: string;
  full_name: string;
  year_level: number;
  degree_program?: string;
}

export function filterMentorshipMatches(
  currentUser: Profile,
  poolProfiles: Profile[]
): Profile[] {
  const isSenior = currentUser.year_level >= 3;
  return poolProfiles.filter((candidate) => {
    if (candidate.id === currentUser.id) return false;
    if (isSenior) {
      // Seniors match with Mentees (year_level 1 or 2)
      return candidate.year_level < 3;
    } else {
      // Mentees match with Mentors (year_level 3 or 4)
      return candidate.year_level >= 3;
    }
  });
}

describe("Mentorship Matching Pool Logic", () => {
  const seniorUser: Profile = { id: "user-senior", full_name: "Senior Tutor", year_level: 4 };
  const juniorUser: Profile = { id: "user-junior", full_name: "Junior Learner", year_level: 1 };

  const pool: Profile[] = [
    { id: "user-senior", full_name: "Senior Tutor", year_level: 4 },
    { id: "peer-senior", full_name: "Peer Senior", year_level: 3 },
    { id: "mentee-1", full_name: "Freshman A", year_level: 1 },
    { id: "mentee-2", full_name: "Sophomore B", year_level: 2 },
  ];

  it("filters junior mentees when senior user views pool", () => {
    const matches = filterMentorshipMatches(seniorUser, pool);
    expect(matches).toHaveLength(2);
    expect(matches.map((m) => m.full_name)).toEqual(["Freshman A", "Sophomore B"]);
  });

  it("filters senior mentors when junior user views pool", () => {
    const matches = filterMentorshipMatches(juniorUser, pool);
    expect(matches).toHaveLength(2);
    expect(matches.map((m) => m.full_name)).toEqual(["Senior Tutor", "Peer Senior"]);
  });

  it("excludes current user from matches pool", () => {
    const matches = filterMentorshipMatches(seniorUser, pool);
    expect(matches.some((m) => m.id === seniorUser.id)).toBe(false);
  });
});
