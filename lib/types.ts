/** Central type definitions -- each interface mirrors a Supabase table. */

export type UserRole = "administrator" | "tutor" | "learner"

export interface Role {
  id: string
  name: UserRole
}

export interface Profile {
  id: string
  role_id: string
  full_name: string
  email: string
  avatar_url: string | null
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
  created_at: string
  profiles?: Profile
  tutor_specializations?: { specializations: Specialization }[]
}

export interface TutorAvailability {
  id: string
  tutor_id: string
  day_of_week: number // 0 = Sunday ... 6 = Saturday
  start_time: string  // "HH:MM:SS"
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

export interface AnalyticsLog {
  id: string
  user_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

/** Maps day_of_week numbers (0-6) to readable names. */
export const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const
