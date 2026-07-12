/** Shared UI constants used across dashboard components and pages. */

export const SESSION_STATUS_COLORS: Record<string, string> = {
  pending: "bg-warning/10 text-warning-foreground border-warning/30",
  confirmed: "bg-primary/10 text-primary border-primary/30",
  completed: "bg-success/10 text-success border-success/30",
  cancelled: "bg-destructive/10 text-destructive border-destructive/30",
}

/**
 * XP awarded for each action. Keys must match what is passed as `action`
 * in calls to earnXp() and the POST /api/xp/earn body.
 */
export const XP_AWARDS = {
  // Sessions
  SESSION_COMPLETED: 50,
  SESSION_BOOKED: 5,

  // Study tools
  QUIZ_SUBMITTED: 20,
  QUIZ_CREATED: 25,
  FLASHCARD_REVIEW_COMPLETED: 50,
  STUDY_SET_CREATED: 15,
  STUDY_SET_SHARED: 10,

  // Resources
  RESOURCE_UPLOADED: 100,
  RESOURCE_FAVORITED: 5,

  // Community / Forums
  FORUM_POST_CREATED: 8,
  FORUM_REPLY_CREATED: 5,
  FORUM_POST_UPVOTED: 3,

  // Study Groups
  STUDY_GROUP_JOINED: 10,
  STUDY_GROUP_CREATED: 20,

  // Profile
  PROFILE_COMPLETED: 25,
  REFERRAL_SENT: 30,
  DAILY_LOGIN: 5,

  // Secrets
  SECRET_EGG_FOUND: 100,
} as const satisfies Record<string, number>;
