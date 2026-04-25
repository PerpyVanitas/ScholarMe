/** Central type definitions -- each interface mirrors a Supabase table. */

export type UserRole = "administrator" | "tutor" | "learner"

export interface Role {
  id: string
  name: UserRole
}

export interface Profile {
  id: string
  role_id: string | null
  full_name: string
  first_name?: string | null
  last_name?: string | null
  email: string
  avatar_url: string | null
  phone_number?: string | null
  birthdate?: string | null
  date_of_birth?: string | null
  membership_number?: string | null
  profile_completed?: boolean | null
  terms_accepted_at?: string | null
  created_at: string
  roles?: Role
}

export interface AuthCard {
  id: string
  user_id: string
  card_id: string
  pin: string
  status: "active" | "revoked"
  issued_at: string
  profiles?: Profile
}

export interface Specialization {
  id: string
  name: string
}

export interface Tutor {
  id: string
  user_id: string
  bio: string | null
  rating: number
  total_ratings: number
  years_experience?: number | null
  hourly_rate?: number | null
  created_at: string
  profiles?: Profile
  tutor_specializations?: { specializations: Specialization }[]
}

export interface TutorAvailability {
  id: string
  tutor_id: string
  day_of_week: number
  start_time: string
  end_time: string
}

export type SessionStatus = "pending" | "confirmed" | "completed" | "cancelled"

export interface Session {
  id: string
  tutor_id: string
  learner_id: string
  scheduled_date: string
  start_time: string
  end_time: string
  specialization_id: string | null
  status: SessionStatus
  notes: string | null
  created_at: string
  tutors?: Tutor & { profiles?: Profile }
  learner_profile?: Profile
  specializations?: Specialization
  session_ratings?: SessionRating[]
}

export interface SessionRating {
  id: string
  session_id: string
  learner_id: string
  rating: number
  feedback: string | null
  created_at: string
}

export interface Repository {
  id: string
  owner_id: string
  title: string
  description: string | null
  access_role: "all" | "tutor" | "admin"
  created_at: string
  profiles?: Profile
  resources?: Resource[]
}

export interface Resource {
  id: string
  repository_id: string
  title: string
  description: string | null
  url: string
  file_type: string | null
  uploaded_by: string
  created_at: string
  profiles?: Profile
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: "session" | "system" | "resource"
  is_read: boolean
  link: string | null
  created_at: string
}

export interface Timesheet {
  id: string
  tutor_id: string
  user_id: string
  clock_in: string
  clock_out: string | null
  notes: string | null
  created_at: string
  tutors?: Tutor & { profiles?: Profile }
}

export interface AnalyticsLog {
  id: string
  user_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const

export type PollStatus = "draft" | "active" | "closed"

export interface Poll {
  id: string
  title: string
  description: string | null
  created_by: string | null
  status: PollStatus
  start_date: string
  end_date: string
  allow_multiple_votes: boolean
  is_anonymous: boolean
  created_at: string
  updated_at: string
  profiles?: Profile
  poll_options?: PollOption[]
}

export interface PollOption {
  id: string
  poll_id: string
  option_text: string
  display_order: number
  created_at: string
  vote_count?: number
}

export interface UserVote {
  id: string
  poll_id: string
  option_id: string
  user_id: string
  created_at: string
}

export interface DeviceToken {
  id: string
  user_id: string
  token: string
  platform: "ios" | "android" | "web"
  created_at: string
  updated_at: string
}

export interface Conversation {
  id: string
  participant_id: string
  messages?: ConversationMessage[]
  profiles?: Profile
  created_at: string
  updated_at: string
}

export interface ConversationMessage {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  sender?: Profile
}
