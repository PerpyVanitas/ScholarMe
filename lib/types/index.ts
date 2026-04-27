/**
 * Central type re-exports — import from "@/lib/types" continues to work.
 * For new code, prefer importing directly from the feature-scoped files:
 *   import type { Session } from "@/lib/types/session"
 *   import type { Profile } from "@/lib/types/auth"
 */

export type { UserRole, Role, Profile, AuthCard } from "./auth"
export type { Specialization, Tutor, TutorAvailability } from "./tutor"
export type { SessionStatus, Session, SessionRating } from "./session"
export type { Repository, Resource, PollStatus, Poll, PollOption, UserVote } from "./content"
export type { Notification, Timesheet, AnalyticsLog, DeviceToken } from "./system"
export type { ConversationParticipant, Conversation, ConversationMessage, Message } from "./messaging"
export { DAYS_OF_WEEK } from "./system"
