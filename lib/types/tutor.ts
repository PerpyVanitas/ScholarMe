/** Feature types: tutors, availability, specializations */

import type { Profile } from "./auth"

export interface Specialization {
  id: string
  name: string
}

export interface Tutor {
  id: string
  profile_id: string
  bio: string | null
  rating: number
  total_ratings: number
  years_experience: number | null
  hourly_rate: number | null
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
