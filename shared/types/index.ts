/** Shared type definitions used across multiple features */

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

export interface Specialization {
  id: string
  name: string
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
