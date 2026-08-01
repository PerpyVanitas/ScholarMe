import { describe, it, expect } from "vitest";
import { identifyStaleAccounts } from "../account-pruning";

describe("identifyStaleAccounts Utility", () => {
  it("identifies accounts inactive for > 180 days with uncompleted profile", () => {
    const oldDate = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString();
    const recentDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();

    const sampleAccounts = [
      { id: "1", email: "stale1@example.com", fullName: "Stale User", role: "learner", createdAt: oldDate, profileCompleted: false },
      { id: "2", email: "active@example.com", fullName: "Active User", role: "learner", createdAt: recentDate, profileCompleted: true },
    ];

    const stale = identifyStaleAccounts(sampleAccounts);
    expect(stale.length).toBe(1);
    expect(stale[0].id).toBe("1");
  });
});
