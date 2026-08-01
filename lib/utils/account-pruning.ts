/**
 * Utility for analyzing stale accounts and identifying candidates for automated pruning or archiving.
 * Accounts inactive for > 180 days without profile completion or verifications are flagged.
 */

export interface UserAccountMetadata {
  id: string;
  email: string;
  fullName: string;
  role: string;
  lastSignInAt?: string;
  createdAt: string;
  profileCompleted: boolean;
}

export function identifyStaleAccounts(
  accounts: UserAccountMetadata[],
  inactivityDaysThreshold = 180
): UserAccountMetadata[] {
  const now = new Date();
  const thresholdMs = inactivityDaysThreshold * 24 * 60 * 60 * 1000;

  return accounts.filter((account) => {
    const referenceDate = account.lastSignInAt
      ? new Date(account.lastSignInAt)
      : new Date(account.createdAt);

    const inactiveTimeMs = now.getTime() - referenceDate.getTime();
    const isInactive = inactiveTimeMs >= thresholdMs;

    // Prune candidates: inactive for > threshold AND (profile not completed OR basic learner role)
    return isInactive && (!account.profileCompleted || account.role === "learner");
  });
}
