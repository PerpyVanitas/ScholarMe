/**
 * Central type definitions — ScholarMe.
 *
 * Types are organized by feature domain in `lib/types/`:
 *   lib/types/auth.ts      — Role, Profile, AuthCard, UserRole
 *   lib/types/tutor.ts     — Tutor, TutorAvailability, Specialization
 *   lib/types/session.ts   — Session, SessionRating, SessionStatus
 *   lib/types/content.ts   — Repository, Resource, Poll, PollOption, UserVote
 *   lib/types/messaging.ts — Conversation, ConversationMessage, Message
 *   lib/types/system.ts    — Notification, Timesheet, AnalyticsLog, DeviceToken
 *
 * All existing imports from "@/lib/types" continue to work unchanged.
 */

export type { UserRole, Role, Profile, AuthCard } from "./types/auth"
export type { Specialization, Tutor, TutorAvailability } from "./types/tutor"
export type { SessionStatus, Session, SessionRating } from "./types/session"
export type { Repository, Resource, PollStatus, Poll, PollOption, UserVote } from "./types/content"
export type { Notification, Timesheet, AnalyticsLog, DeviceToken } from "./types/system"
export type { ConversationParticipant, Conversation, ConversationMessage, Message } from "./types/messaging"
export { DAYS_OF_WEEK } from "./types/system"
